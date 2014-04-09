
var camelize = require('./camelize');
var exec = require('./exec');

// xyz

var assert = require('assert');
var Module = require('module');


// idea borrowed from 
// https://github.com/fluidsonic/poison/blob/master/lib/poison.js

var registry = {};
var originalPrototypeRequire = Module.prototype.require;
var originalRequire = require;

Module.prototype.require = require_monad;
function require_monad(param) {

  var self = this;
  var id = this.id;
  var type = typeof param;
  var name, alias;
  var temp;
  var filename;
  var child;
  var childId;
  var cache;
  
  registry[id] || (registry[id] = { module: this, require: originalRequire });
  
  if (type == 'function') {
    temp = exec.call(registry[id].module.exports, registry[id], param);
    delete registry[id]; // reclaim key for next use
    return temp || this.exports;
  }
  
  // get var_alias from {x}:path
  // get path_alias from {a/b}:path
  // import x as y
  
  assert(typeof param == 'string', 'param must be a string');
  assert(param, 'missing param');
   
  filename = Module._resolveFilename(param, this);
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, this);  
  
  childId = camelize(param);
  registry[id][childId] = child;
  
  //console.log('saved ' + filename + 'to ' + id + ' in ' + this.parent.id)
  //console.log(require.cache[filename]);// === Module._cache[filename].id);

  // here's the monadic part
  // have to override this or context is set on parent rather than this
  function requireMonad(p) {
    return self.require(p);
  }
  
  return requireMonad;
};

