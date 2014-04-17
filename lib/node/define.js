// lib/node/define

var camelize = require('./camelize');
var exec = require('./exec');
var assert = require('assert');
var Module = module.constructor; // <= stay out of other processes

// STUFF
var registry = {}; // store loaded contexts
var stack = []; // brain-dead synchronized lifo loading

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
  
  var parent = stack.slice(-1)[0] || module.parent;
  
  // error out if id doesn't resolve (that's good; let node handle it)
  var filename = Module._resolveFilename(id, parent);
  var context = new Context(filename);

  registry[filename] = context;  
  stack.push(context);

  return context.defineNext;
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
function Context(filename) {
  
  this.filename = filename;
  this.module = module.parent;
  this.__dirname = __dirname; 
  this.__filename = __filename;
  
  // assigns 'own' property for the exec() function
  this.require = parentRequire;
}

/*
 *
 */
Context.prototype.defineNext = defineNext;
function defineNext(param) {

  var self = stack.slice(-1)[0];

  var id = self.filename;
  var type = typeof param;
  var filename;
  var child;
  var alias;
  var cache;
  var value;
  var pair;

  // function exec case
  if (type == 'function') {
        
    self = registry[id];
    value = exec.call(self.module.exports, self, param) || self.module.exports;
    stack.pop();

    return value;
  }

  // on to string handling case
  assert(type == 'string', 'param must be a string');
  
  // TODO ~ PATH AND VAR ALIASING
  
  // get var_alias from {x}:=path
  // get path_alias from {a/b}:=path
  // import global {x} from pathsd
  // alias {y} from global {x}
  
  // var alias
  pair = param.split(':=');
  
  if (pair.length > 1) {
  
    alias = pair[0];
    param = pair[1];
    
  } else {
    alias = camelize(param);
  }
  
  // error out if id doesn't resolve (that's good; let node handle it)  
  filename = Module._resolveFilename(param, self.module);
  
  // first for aliases we have to clear out the cache
  if (pair.length > 1) {
  
    // 17 APR 2014 - this took a very long time to figure out
    // if we're aliasing we have to delete the previously mapped version of this
    // of this module if it exists because it's been exec'd already.
    
    delete Module._cache[filename];
  }

  // find its exports in the cache
  // else try to load/return its exports
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, self.module);

  assert(child, 'module not found at ' + filename + ' for ' + param);

  // third - module that doesn't use define() doesn't register itself, so we 
  // have to do that manually
  registry[filename] || (registry[filename] = { 
                           module: Module._cache[filename]
                         });
  
  // fourth - put it in the local cache variable so we can register it as a 
  // namespaced aliased dependant
  cache = registry[filename].module;
  
  registry[id][alias] = (cache && cache.exports) || child;

  // continue on
  return self.defineNext;  
}
