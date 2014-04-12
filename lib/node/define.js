// lib/node/define

var camelize = require('./camelize');
var exec = require('./exec');
var assert = require('assert');
var Module = module.constructor;

// STUFF
var registry = {};
var stack = []; // brain-dead synchronized loading

/*
 *
 */
global.define = define;
function define(param) {
  var context = new Context();
  stack.push(context);  
  return context.define(param);
}

/*
 *
 */
define.assert = assertId;
function assertId(id) {

  assert(typeof id == 'string', 'id must be a string');
  
  // this will error out if id doesn't resolve (that's good - node handle it)
  var filename = Module._resolveFilename(id, module.parent);
  var context = new Context(filename);
  stack.push(context);
  return context.define;
}

/*
 *
 */
function Context(filename) {
  // it looks like a class
  this.filename = filename || __filename;
  this.module = module.parent;
  
  this.require = parentRequire; // <= could be the problem
  
  this.__dirname = __dirname; 
  this.__filename = __filename;
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

  var self = stack.slice(-1)[0];
  var id = self.filename;
  var type = typeof param;
  var filename;
  var child;
  var childId;
  var cache;
  var context;
  
  //console.log(id + ', ' + self.filename + ' ' + stack.length);
  
  // object creation part should "probably" go in the context constructor,
  // once I figure out how to do that correctly
  registry[id] || (registry[id] = self);

  if (type == 'function') {
  
    context = registry[id];
    
    // need to do something to preserve this for nested calls
    //delete registry[id]; // reclaim key for next use - may be an anti-pattern
        
    context = exec.call(context.module.exports, context, param) || context.module.exports;

    stack.pop();
    
    return context;
  }
  
  // TODO ~ PATH AND VAR ALIASING
  
  // get var_alias from {x}:=path
  // get path_alias from {a/b}:=path
  // import global {x} from path
  // alias {y} from global {x}

  assert(type == 'string', 'param must be a string');
  assert(param, 'missing param');
  
  childId = camelize(param);
  filename = Module._resolveFilename(param, self.module);
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, self.module);
  
  assert(child, 'child not returned');

  registry[filename] || (registry[filename] = { module: Module._cache[filename] });
  
  cache = registry[filename].module;
  registry[id][childId] = (cache && cache.exports) || child;
  
  return self.define;  
}
