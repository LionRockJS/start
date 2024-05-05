import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import path from 'node:path';
import ncp from 'ncp';

const init = async dir => {
  await new Promise((resolve, reject) => {
    ncp(path.normalize(`${__dirname}/default/module`), path.normalize(`${dir}`), err => {
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
};

export default async dir => {
  await init(dir);
};
