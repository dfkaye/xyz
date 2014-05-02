// lib/node/define
// newer more monadic version
// 20-22 APRIL 2014
// 
// graph 1 MAY 2014

var camelize = require('./camelize');
var exec = require('./exec');
var graph = require('./graph');

/* ---------------- */

//var assert = require('assert');
function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

/* ---------------- */

var Module = module.constructor; // <= stay out of other processes
var parent = module.parent; // everything loads relative to the 'main' module

function Namespace(filename) {
  this.id = filename;
  this.module = cache(filename); // loads real module from cache
  this.__filename = filename;
  this.__dirname = dirname(filename);
  this.require = parentRequire;
}

function parentRequire(id) {
  return parent.require(id);
}

parentRequire.cache = Module._cache;

function cache(filename) {

  //var filename = Module._resolveFilename(id, parent);
  var cache = Module._cache;
  
  if (!cache[filename]) {
    Module._load(filename);
  }
  
  return cache[filename];
}

function dirname(filename) {

  var w = filename.lastIndexOf('\\');
  var u = filename.lastIndexOf('/');
  
  return filename.substring(0, w > u ? w : u);
}

/* ---------------- */

// hold namespaces here
var registry = {};

module.exports = global.define = define;

function define(param) {
  assert((typeof param).match(/string|function/),
         'param must be string or function');
  return define.id(__filename)(param);
}

define.id = function (id) {

  function monad(param) {
    var self = monad.namespace;
    var type = typeof param;
    
    // handle invalid type? then...
    
    var value = type == 'function' && exec(param, self);

    return value || (type == 'string' && string(param, monad));
  }
  
  // resolve id filename (); then registry, attach and away...
  
  var filename = Module._resolveFilename(id, parent);

  // help keep requests and cycles to a minimum
  graph(filename);
  
  // namespace or context containing varnames to be injected into exec fn
  monad.namespace = registry[filename] || 
    (registry[filename] = new Namespace(filename));

  // bind inner define to the current namespace ~ no .id() call, no aliasing ~
  // to support lazier loading
  // and return
  return monad.namespace.define = monad;
}

function string(id, monad) {

  // parse, load, and away...
  
  // trim id string...
  // id = id.replace(/^\s+|\s+$/gm, '');
  id = id.trim();
  
  var self = monad.namespace;
  var pair = id.split(':=');
  var alias, globalName;
  
  if (pair.length > 1) {
  
    // var alias
    alias = pair[0].trim();
    id = pair[1].trim();
    
    // global alias
    globalName = alias.match(/\{[^\}]+\}/);
    globalName && (alias = globalName[0].replace(/\{|\}/g, ''));
    
    // id alias
    alias.indexOf('/') === -1 || (alias = camelize(alias));
    
  } else {
  
    alias = camelize(id);
  }
  
  
  // HANDLE CYCLES
  
  var filename = Module._resolveFilename(id, self.module);

  assert(filename !== parent.filename && filename !== self.module.id, 
         'file cannot require itself');
         
  var cycle = graph(self.module.id, filename).resolve(filename);
  
  if (cycle) {
    throw new Error(cycle);
  }
  
  
  var entry = registry[filename];
  
  if (!entry || !entry.module || !('exports' in entry.module)) {
  
    // either the file is a node_module (like 'fs') or a commonjs module (not 
    // using define()), so it has to be require()'d,
    // or it just hasn't been loaded & registered at least once yet...
    
    //console.log('using require: ' + filename);    

    // using real module require
    entry = self.module.require(filename);
    
  } else {
  
    //console.log('registered: ' + filename);    

    entry = entry.module.exports;
  }
  
  // using real module require
  //self[alias] = self.module.require(filename);

  if (globalName) {
    self[alias] = global[alias];
  } else {
    self[alias] = entry;
  }
  
  return monad;
}
