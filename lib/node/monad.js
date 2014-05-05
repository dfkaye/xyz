// lib/node/define
// newer more monadic version
// 20-22 APRIL 2014
// 
// graph 1 MAY 2014

var camelize = require('./camelize');
var exec = require('./exec');
var graph = require('./graph');

/* ---------------- */

var Module = module.constructor; // <= stay out of other processes
var registry = {}; // hold namespaces here

/* ---------------- */

module.exports = global.define = define;

/* ---------------- */

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

/* ---------------- */

/*
 * namespace holds set of 'own' names that are written into scope by the exec()
 * function. hold on to a real module.  repeats work done by environment to set 
 * up require.cache, require.resolve, and bind require to the encapsulated 
 * module correctly (rather than parent, etc.).  though laborious this solution
 * 
 */
function Namespace(filename, monad) {
  var self = this;
  
  self.id = filename;
  self.__filename = filename;
  self.__dirname = dirname(filename);

  self.module = cache(filename); // load real module from cache
  
  // 5 MAY 2014 - make require locally, get out of relying on parent
  self.require = function require(id) {
    return self.module.require(id);
  };
  
  self.require.resolve = function resolve(request) {
    return Module._resolveFilename(request, self.module);
  };
  
  self.require.cache = Module._cache;  
}

function cache(filename) {

  var cache = Module._cache;
  
  if (!cache[filename]) {
    Module._load(filename);
  }
  
  return cache[filename];
}

function dirname(filename) {

  var w = filename.lastIndexOf('\\'); // windows
  var u = filename.lastIndexOf('/'); // unix
  
  return filename.substring(0, w > u ? w : u);
}

/* ---------------- */

function define(param) {
  assert((typeof param).match(/string|function/),
         'param must be string or function');
         
  return define.id(__filename)(param);
}

define.id = function (id) {

  function monad(param) {
  
    var self = monad.namespace;
    var type = typeof param;
    
    // handle invalid type? or...
    
    var value = type == 'function' && exec(param, self);

    return value || (type == 'string' && string(param, monad));
  }
  
  // resolve the id pathname with respect to THIS module
  var filename = Module._resolveFilename(id, module);
  
  // namespace or context containing varnames to be injected into exec fn
  var ns = registry[filename] || (registry[filename] = new Namespace(filename));
  
  // memoize monad as 'define' on namespace to support lazy loading
  monad.namespace = ns;

  // track requests fpr cycle checking later
  graph(filename);
  
  return ns.define = monad;
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
    
    // still considering whether to use graph alias or ot
    //console.log('graph alias: ' + id + ' as ' + alias);
    
  } else {
  
    alias = camelize(id);
  }
  
  // handle relative required pathnames for async loading, eventually
  var filename = Module._resolveFilename(id, self.module);
  
  
  // HANDLE CYCLES
  var cycle = graph(self.module.id, filename).resolve(filename);
  assert(!cycle, cycle);  
  
  var entry = registry[filename];
  
  if (!entry || !entry.module || !('exports' in entry.module)) {
    //console.log('using require: ' + filename);    

    /*
     * using the real module require when:
     *
     * 1. the file is a node_module (like 'fs') or a commonjs module (not 
     *    using define()), so it has to be require()'d,
     * 2. it hasn't been loaded & registered at least once yet...
     */
    
    entry = self.module.require(filename);
  } else {
    //console.log('registered: ' + filename);    

    entry = entry.module.exports;
  }
  
  if (globalName) {
    self[alias] = global[alias];
  } else {
    self[alias] = entry;
  }
  
  return monad;
}
