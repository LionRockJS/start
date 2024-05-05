import { mkdirp } from 'mkdirp';
import path from 'node:path';
import scaffold from '../scaffold.mjs';
import scaffoldWebform from '../scaffold-webform.mjs';
import scaffoldAdmin from '../scaffold-admin.mjs';
import scaffoldAdminCMS from '../scaffold-admin-cms.mjs';

describe('scaffold test', () => {
  test('scaffold web', async () =>{
    const dir = path.normalize(`${__dirname}/test/web`);
    await mkdirp(dir);

    await scaffold(dir);

//    await unlink(dir);
  })

  test('scaffold webform', async () =>{
    const dir = path.normalize(`${__dirname}/test/webform`);
    await mkdirp(dir);

    await scaffoldWebform(dir);
  });

  test('scaffold admin', async () =>{
    const dir = path.normalize(`${__dirname}/test/admin`);
    await mkdirp(dir);

    await scaffoldAdmin(dir);
  });

  test('scaffold admin cms', async () =>{
    const dir = path.normalize(`${__dirname}/test/cms`);
    await mkdirp(dir);

    await scaffoldAdminCMS(dir);
  });
});