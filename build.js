// build.js
// npm run build

console.log('build.js');

var fs = require('fs');


// clean 
// add a rename/archive step?

// http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

deleteFolderRecursive(__dirname + '/build/');

if (!fs.existsSync(__dirname + '/build/')){
  fs.mkdirSync(__dirname + '/build/');
}


// concat build
function build(path) {
  return fs.readFileSync(path, { encoding: 'ascii' });
}

var text = [];

text.push(build('./lib/node/browser.js'));
text.push(build('./lib/node/monad.js'));

// fs.writeFile(filename, data, [options], callback)
// Asynchronously writes data to a file, replacing the file if it already exists. data can be a string or a buffer.
fs.writeFile(__dirname + '/build/bundle.js', text.join('\n'), { encoding: 'ascii' }, function (err) {
  if (err) throw err;
  console.log('built: ' + __dirname + '/build/bundle.js');
});
