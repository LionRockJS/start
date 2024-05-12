import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import pluralize from 'pluralize';
import DateBase from 'better-sqlite3';
import { buildSchema } from 'graphql';
import fs from 'node:fs';
import {mkdirp} from 'mkdirp';
import path from 'node:path';
import graphqlSQL from 'graphql-to-sqlite-ddl';
const { parse, insert, schemaHeader } = graphqlSQL;
import codeGen from './graphql-orm.mjs';

const readFileOptions = { encoding: 'utf8', flag: 'r' };
const interfaces = fs.readFileSync(`${__dirname}/GraphQL/_interfaces.graphql`, readFileOptions);

export default async function build(dirname, entity, database, databaseSubFolder="", isImportData=false, wal=false){
  const defaultDatabasePath = `${dirname}/../../default${databaseSubFolder? `/${databaseSubFolder}` : ''}`;
  const modelPath = path.normalize(`${dirname}/../exports/${entity}/model`);
  const exportPath = `${dirname}/../exports/${entity}`;

  await buildCore(
    `${dirname}/${database}.graphql`,
    ((isImportData) ? `${dirname}/${database}.mjs` : ""),
    `${exportPath}/${database}.sql`,
    `${defaultDatabasePath}/${database}.sqlite`,
    path.normalize(`${modelPath}`),
    wal
  )
}

async function buildCore(GraphQL_Path, SamplePath, SQL_Path, DB_Path, classPath, wal = false) {
  await mkdirp(path.dirname(SQL_Path));
  await mkdirp(path.dirname(DB_Path));
  await mkdirp(path.normalize(classPath));
  let schema;
  let sql;
  let db;

  try {
    const typeDef = fs.readFileSync(GraphQL_Path, readFileOptions);
    schema = buildSchema(schemaHeader + interfaces + typeDef);
  } catch (e) {
    console.log('Error build schema');
    console.log(e);
    console.log(GraphQL_Path);
  }

  try {
    sql = parse(schema);
    fs.writeFileSync(SQL_Path, sql, { encoding: 'utf8' });

    // delete db
    if (fs.existsSync(DB_Path))fs.unlinkSync(DB_Path);
    fs.writeFileSync(DB_Path, '', { encoding: 'utf8' });
    db = new DateBase(DB_Path);
    db.exec(sql);

    console.log(`${path.normalize(SQL_Path)} write successfully.`);
  } catch (e) {
    console.log(e);
    console.log('Error parse SQL');
    console.log(GraphQL_Path);
  }

  try {
    if (SamplePath !== '') {
      const samples = await import(SamplePath);
      const inserts = insert(samples.default || samples);
      db.exec(inserts);
    }
  } catch (e) {
    console.log(e);
    console.log('Error insert sample data');
    console.log(SamplePath);
  }

  try {
    const classes = codeGen(schema);
    classes.forEach((v, k) => {
      const targetPath = `${classPath}/${pluralize.singular(k)}.mjs`;
      fs.writeFileSync(targetPath, v, { encoding: 'utf8' });
      console.log(`${path.normalize(targetPath)} write successfully.`);
    });
  } catch (e) {
    console.log(e);
    console.log('error generate classes');
    console.log(classPath);
  }

  try {
    if (wal) {
      db.exec('PRAGMA journal_mode=WAL;');
    }
  } catch (e) {
    console.log(e);
    console.log('error set pragma mode ');
  }
}
