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
  context = (new Context);
  return context.define(param);
}

/*
 *
 */
define.assert = assertId;
function assertId(id) {
  assert(typeof id == 'string', 'id must be a string');
  context = (new Context);
  // this will error out if id doesn't resolve (that's good - node handle it)
  context.id = Module._resolveFilename(id, module.parent);
  return context.define;
}

/*
 *
 */
function Context() {
  // it looks like a class
}

Context.prototype.id = undefined;

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
  
  // object creation part should "probably" go in the context constructor,
  // once I figure out how to do that correctly
  
  registry[id] || (registry[id] = { module: module.parent, 
                                    require: this.require, 
                                    __dirname: __dirname, 
                                    __filename: __filename });
  
  if (type == 'function') {
  
    context = registry[id];
    delete registry[id]; // reclaim key for next use - may be an anti-pattern
    
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
