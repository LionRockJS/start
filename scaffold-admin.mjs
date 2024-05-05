import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import path from 'node:path';
import ncp from 'ncp';
import { unlink } from 'fs/promises';
import scaffold from "./scaffold.mjs";

const init = async dir => {
  await scaffold(dir);

  await new Promise((resolve, reject) => {
    ncp(path.normalize(`${__dirname}/default/admin`), path.normalize(`${dir}`), err => {
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

  await unlink(path.normalize(`${dir}/views/templates/home.liquid`));
  await unlink(path.normalize(`${dir}/application/classes/controller/Home.js`));
};

export default async dir => {
  await init(dir);
};
