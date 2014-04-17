// lib/node/define

var camelize = require('./camelize');
var exec = require('./exec');
var assert = require('assert');
var Module = module.constructor; // <= stay out of other processes

// STUFF
var registry = {}; // store loaded contexts
var stack = []; // brain-dead synchronized lifo loading


//registry [id] : { context, dependencies }


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
  stack.push(context);
  return context.defineNext;
}

define.unload = function unload(id) {
  Module._cache = {};
  registry = {};
  stack = [];
}

/*
 * it looks like a class
 */
function Context(filename) {
  
  this.filename = filename;// || __filename;
  this.module = module.parent;
  this.__dirname = __dirname; 
  this.__filename = __filename;
  
  // assigns 'own' property for the exec() function
  this.require = parentRequire; // <= could be a problem
}

/*
 *
 */
Context.prototype.require = parentRequire;

function parentRequire(param) {
  return module.parent.require(param);
}

parentRequire.cache = Module._cache;

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
  var context;
  var pair;
  
  //console.log(id + ', ' + self.filename + ' ' + stack.length);
  // object creation part should "probably" go in the context constructor,
  // once I figure out how to do that correctly
  
  // 16 APR 2014 - THIS ALLOWS IMPORT SHARING BETWEEN CONTEXTS
  //registry[id] || (registry[id] = self);
  
  /* 
   * 16 APR 2014 - STILL NOT SURE THIS IS RIGHT - THIS VERSION PREVENTS IMPORTS
   * FROM PREVIOUS CONTEXT DEFINITION FROM LEAKING INTO A NEW SANDBOXED ONE.
   */
  //(registry[id] === self) || 
  (registry[id] = self);
  
  if (type == 'function') {
        
    context = registry[id];

    //console.log('exec: ' + id)
    // need to do something to preserve this for nested calls
    //delete registry[id]; // reclaim key for next use - may be an anti-pattern
    
    // could just scrape out the keys, i.e., delete reg[id][key], to prevent 
    // leaking across define fn contexts...
    context = exec.call(context.module.exports, context, param) || context.module.exports;

    stack.pop();
    
    return context;
  }

  assert(type == 'string', 'param must be a string');
  
  // TODO ~ PATH AND VAR ALIASING
  
  // get var_alias from {x}:=path
  // get path_alias from {a/b}:=path
  // import global {x} from pathsd
  // alias {y} from global {x}
  
  // var alias
  pair = param.split(':=');
  
  if (pair.length > 0 && pair[1]) {
  
    alias = pair[0];
    param = pair[1];
    
  } else {
    alias = camelize(param);
  }

  // first find it in the cache
  // error out if id doesn't resolve (that's good; let node handle it)  
  filename = Module._resolveFilename(param, self.module);
  
  cache = Module._cache[filename];

  // next try to load/return it
  // left returns cache.exports; right loads and returns exports
  //child = (cache && cache.exports) || Module._load(filename, self.module);
  child = parentRequire(filename);
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


