const print = function(){
  console.log('-------------------------')
  console.log('cd public_source/media/vendors');
  console.log('npm i');
  console.log('or ln -s ../../../../../../../../vendors/node_modules ./node_modules');
  console.log('Copy Vendor folders with following commands:')
  console.log(`
mkdir ../../../public/media/vendors/fontawesome
cp -r ./node_modules/bootstrap/dist ../../../public/media/vendors/bootstrap
cp -r ./node_modules/@fortawesome/fontawesome-pro/webfonts ../../../public/media/vendors/fontawesome/webfonts
cp -r ./node_modules/@fortawesome/fontawesome-pro/css ../../../public/media/vendors/fontawesome/css
cd ../../../
npm i
npm start
`);

  console.log('-------------------------')
  console.log('copy assets from modules: cp -r node_modules/@kohanajs/mod-xxx/install/public .')
  console.log('-------------------------')
}

const print_cms = function(){
  console.log('cp -r ./node_modules/tinymce ../../../public/media/vendors/tinymce')
}

export default {
  print,
  print_cms
}