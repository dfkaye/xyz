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
  
  this.require = parentRequire;
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
  //var id = module.parent.id;
  var id = self.filename;
  var type = typeof param;
  var name, alias;
  var temp;
  var filename;
  var child;
  var childId;
  var cache;
  var ctx;
  //console.log(id + ', ' + self.filename + ' ' + stack.length);
  // object creation part should "probably" go in the context constructor,
  // once I figure out how to do that correctly
  registry[id] || (registry[id] = self);

  if (type == 'function') {
  
    ctx = registry[id];
    
    // need to do something to preserve this for nested calls
    //delete registry[id]; // reclaim key for next use - may be an anti-pattern
    
    //console.log(ctx);
    
    temp = exec.call(ctx.module.exports, ctx, param) || ctx.module.exports;
    //console.log(temp);
    // more clean up
    ctx = undefined;
    stack.pop();
    
    return temp;
  }
  
  // TODO ~ PATH AND VAR ALIASING
  
  // get var_alias from {x}:=path
  // get path_alias from {a/b}:=path
  // import global {x} from path
  // alias {y} from global {x}

  assert(typeof param == 'string', 'param must be a string');
  assert(param, 'missing param');
  
  childId = camelize(param);
  filename = Module._resolveFilename(param, self.module);
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, self.module);
  
  assert(child, 'child not returned');

  //console.log(id + '::' + self.filename + '::' + filename)
  //console.log('id: ' + id + '; childId: ' + childId + '\n' + !!registry[id])
    // console.log(filename + ': ' + !!(registry[filename]));
    // console.log(filename + ': ' + !!(registry[filename] && registry[filename].module));
    // console.log(filename + ': ' + !!(child));
  
  registry[filename] || (registry[filename] = { module: Module._cache[filename] });
  
  temp = registry[filename].module;
  registry[id][childId] = (temp && temp.exports) || child;
  
  //console.dir(registry);
  // here's the monadic part
  return self.define;  
}
