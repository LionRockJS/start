import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import path from 'node:path';
import mkdirp from 'mkdirp';
import ncp from 'ncp';
import note from './install-note.mjs';

const init = async dir => {
  // create folders
  const folders = [
    '/application/classes',
    '/application/classes/controller',
    '/application/classes/model',
    '/views',
    '/views/layout',
    '/views/snippets',
    '/views/templates',
    '/server/tmp',
    '/public',
    '/public_source/media/css',
  ];

  await Promise.all(folders.map(async folder => {
    const f = path.normalize(dir + folder);
    await mkdirp(f);
    console.log(`create folder: ${f}`);
  }));

  await new Promise((resolve, reject) => {
    ncp(path.normalize(`${__dirname}/default/web`), path.normalize(`${dir}`), err => {
      // callback
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      console.log('file copied');
      resolve();
    });
  });

  note.print();
};

export default async dir => {
  await init(dir);
};
