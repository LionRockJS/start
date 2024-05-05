import url from "node:url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

import path from 'node:path';
import ncp from 'ncp';
import note from "./install-note.mjs";
import scaffoldAdmin from "./scaffold-admin.mjs";

const init = async dir => {
  await scaffoldAdmin(dir);

  await new Promise((resolve, reject) => {
    ncp(path.normalize(`${__dirname}/default/admin-cms`), path.normalize(`${dir}`), err => {
      // callback
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      console.log('file copied');

      note.print_cms();
      resolve();
    });
  });
};

export default async dir => {
  await init(dir);
};
