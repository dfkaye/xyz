// lib/node/define

var camelize = require('./camelize');
var exec = require('./exec');
var assert = require('assert');

var Module = module.constructor; // <= stay out of other processes

// STUFF
var registry = {}; // store loaded contexts


/*
 * start the sequence
 */
global.define = define;
function define(param) {

  assert((typeof param).match(/string|function/), 
         'param must be string or function');

  return define.assert(__filename)(param);
}

/*
 * assert path to the module
 * then start the sequence
 *
 * id should be the __filename if item is in its own file
 * else don't assert it
 */
define.assert = assertId;
function assertId(id) {

  assert(typeof id == 'string', 'id must be a string');
  
  var parent = module.parent;
  
  // error out if id doesn't resolve (that's good; let node handle it)
  var filename = Module._resolveFilename(id, parent);
  
  var m = registry[filename];
  (console.log(m && !!m.module));
  
  var context = new Context(filename, parent, (m && m.module));
  
  registry[filename] = context;  
  
  return function (param) {
    return context.define(param);
  };
}


/*
 * this is exposed as [context.require] in the call to exec()
 * so that define function arg can call 'require()' internally with respect to 
 * the define.js module.
 */
function parentRequire(param) {
  return module.parent.require(param);
}

parentRequire.cache = Module._cache;

/*
 * it looks like a class
 */
function Context(filename, parent, module) {
  
  this.filename = filename;
  this.module = new Module(filename, parent); // PROBABLY A MISTAKE // YES THIS IS THE MISTAKE
  this.module.filename = parent.filename;
  this.__dirname = __dirname; 
  this.__filename = __filename;
  
  // assigns 'own' property for the exec() function
  this.require = parentRequire;
}

Context.prototype.define = defineNext;
function defineNext(param) {

  //var self = stack.slice(-1)[0];
  var self = this;
  var id = self.filename;
  var type = typeof param;
  var filename;
  var child;
  var alias;
  var cache;
  var pair;

// console.log(self.filename);
  
  // TODO MOVE TO OWN METHOD
  // function exec case
  if (type == 'function') {
    exec(self, param);
    return self.module.exports;
  }

  // on to string handling case
  assert(type == 'string', 'param must be a string');
  
  // TODO ~ PATH AND VAR ALIASING  
  // TODO MOVE TO OWN METHOD(s) parseName, parsePath, parseGlobal

  // var alias
  pair = param.split(':=');
  
  if (pair.length > 1) {
  
    alias = pair[0];
    param = pair[1];
    
  } else {
    alias = camelize(param);
  }

  // error out if id doesn't resolve (that's good; let node handle it)  
  filename = Module._resolveFilename(param, self.module.parent); // UGH
  
  // find its exports in the cache or try to load/return its exports
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, self.module.parent);
  
  assert(child, 'module not found at ' + filename + ' for ' + param);

  // TODO MAKE CHILD THE RETURN VALUE OF VAR/PATH PARSE

  // TODO MOVE TO OWN METHOD register (filename, id?, alias, child)
  // third - module that doesn't use define() isn't registered so do it manually
  
  // THIS IS THE PROBLEM ~ "REAL" MODULE VS. PROXY ~ STOP PROXYING
  registry[filename] || (registry[filename] = { 
                           module: Module._cache[filename]
                         });

  cache = registry[filename].module;

  // fourth - register its module.exports as a namespaced aliased dependant
  self[alias] = (cache && cache.exports) || child;
  
// console.log(id + ': ' + alias + ': ' + self[alias]);
// console.log(id + ': ' + self.module.exports);

  // continue on
  return function (param) {
    return self.define(param);
  };
}
