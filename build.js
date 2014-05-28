// build.js
// npm run build

console.log('build.js');

var fs = require('fs');

function build(path) {
  return fs.readFileSync(path, { encoding: 'ascii' });
}

var text = [];

text.push(build('./lib/node/assert.js'));
text.push(build('./lib/node/module.js'));
text.push(build('./lib/node/script.js'));
text.push(build('./lib/node/camelize.js'));
text.push(build('./lib/node/make.js'));
text.push(build('./lib/node/graph.js'));
// namespace
text.push(build('./lib/node/monad.js'));
// exec
// string

// console.log(text.length);
// console.log(text);

console.log(__dirname);

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
//console.log(fs.statSync(__dirname + '/build/').isDirectory());


// if (!fs.statSync(__dirname + '/build/')){
  // fs.mkdirSync(__dirname + '/build/', 0766, function(err) {
    // if (err) { 
      // console.log(err);
      // response.send("ERROR! Can't make the directory! \n");    // echo the result back
    // }
  // });   
// }
 
// fs.writeFile(filename, data, [options], callback)
// Asynchronously writes data to a file, replacing the file if it already exists. data can be a string or a buffer.
fs.writeFile(__dirname + '/build/bundle.js', text.join('\n'), { encoding: 'ascii' }, function (err) {
  if (err) throw err;
  console.log('It\'s saved!');
});
  
  
// console.log(build('./lib/node/assert.js'));
// console.log(build('./lib/node/module.js'));
// console.log(build('./lib/node/camelize.js'));
// console.log(build('./lib/node/make.js'));
// console.log(build('./lib/node/graph.js'));
// console.log(build('./lib/node/monad.js'));
