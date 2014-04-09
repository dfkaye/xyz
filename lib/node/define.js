// lib/node/define

var camelize = require('./camelize');
var exec = require('./exec');
var assert = require('assert');
var Module = module.constructor;

// STUFF
var registry = {};
var context;

/*
 *
 */
global.define = define;
function define(param) {
  // create new context
  context = (new Context)
  return context.define(param);
}

/*
 *
 */
define.as = as;
function as(id) {
  context.id = id;
  return context.define;
}

/*
 *
 */
function Context() {
  // it looks like a class
}

/*
 *
 */
Context.prototype.require = parentRequire;
function parentRequire(param) {
  return module.parent.require(param);
}

/*
 *
 */
parentRequire.cache = Module._cache;

/*
 *
 */
Context.prototype.define = monad;
function monad(param) {

  var self = this;
  var id = module.parent.id;
  var type = typeof param;
  var name, alias;
  var temp;
  var filename;
  var child;
  var childId;
  var cache;
  var context;
  
  registry[id] || (registry[id] = { module: module.parent, 
                                    require: this.require, 
                                    __dirname: __dirname, 
                                    __filename: __filename });
  
  if (type == 'function') {
  
    context = registry[id];
    delete registry[id]; // reclaim key for next use
    
    temp = exec.call(context.module.exports, context, param) || context.module.exports;
    
    // more clean up
    context = undefined;
    return temp;
  }
  
  // TODO ~ PATH AND VAR ALIASING
  
  // get var_alias from {x}:path
  // get path_alias from {a/b}:path
  // import x as y
  
  assert(typeof param == 'string', 'param must be a string');
  assert(param, 'missing param');
  
  
  filename = Module._resolveFilename(param, module.parent);
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, module.parent);
  
  childId = camelize(param);
  registry[id][childId] = child;
  
  assert(child, 'child not returned');
  
  // here's the monadic part
  return self.define;  
}
