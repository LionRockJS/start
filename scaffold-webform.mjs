import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import path from 'node:path';
import ncp from 'ncp';
import scaffold from './scaffold.mjs';

const init = async dir => {
  await scaffold(dir);

  await new Promise((resolve, reject) => {
    ncp(path.normalize(`${__dirname}/default/webform`), path.normalize(`${dir}`), err => {
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
