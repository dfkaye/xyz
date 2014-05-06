// lib/node/monad
// 20-22 APRIL 2014 ! monadic version ! replaces lib/node/define spritzer
// 1 MAY 2014 ! graph !
// 5 MAY 2014 ! get rid of parent references !

/* ---------------- */

module.exports = global.define = define;

/* ---------------- */

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

var camelize = require('./camelize');
var exec = require('./exec');
var graph = require('./graph');

var Module = module.constructor; // <= stay out of other processes
var registry = {}; // hold namespaces here

/*
 * creates a namespace which holds set of 'own' names that to be written into 
 * scope as globals by the exec() function. holds on to a real module. though 
 * laborious, this solution repeats work done by environment in order to bind 
 * module.require() to the encapsulated module, and map the require.cache{} and 
 * require.resolve() api to the Module api.
 */
function namespace(filename) {
  
  var self = {};
 
  self.id = filename;
  self.__filename = filename;
  self.__dirname = dirname(filename);

  // load real module from cache
  self.module = retrieve(filename); 
  
  // 5 MAY 2014 - 'reimplement' require locally to get out of relying on parent
  self.require = function require(id) {
    return self.module.require(id);
  };
  self.require.resolve = function resolve(request) {
    return Module._resolveFilename(request, self.module);
  };
  self.require.cache = Module._cache;
  
  return self;
}

/*
 * get the module out of the cache. load it if it's not there.
 */
function retrieve(filename) {
  Module._cache[filename] || Module._load(filename);
  
  return Module._cache[filename] ;
}

/*
 * utility method returns the directory name for the given filename,
 * normalizing separator character to unix (forward slash).
 */
function dirname(filename) {
  var w = filename.lastIndexOf('\\'); // windows
  var u = filename.lastIndexOf('/'); // unix
  
  return filename.substring(0, w > u ? w : u);
}

/* ---------------- */

/*
 * temporary entry point ~ will be replaced with def.id()
 */
function define(param) {
  assert((typeof param).match(/string|function/),
         'param must be string or function');
         
  return define.id(__filename)(param);
}

/*
 * real entry point for declaring a namespace and returning the collector monad 
 * function.
 */
define.id = function (id) {
  
  // resolve the id pathname with respect to THIS module
  var filename = Module._resolveFilename(id, module);
  var ns = registry[filename] || (registry[filename] = namespace(filename));
  
  // track requests for cycle checking later
  graph(filename);
  
  // return this function to collect parameters on successive invocations
  function monad(param) {
    var self = monad.namespace;
    var type = typeof param;
    
    // handle invalid type? or...
    
    var value = type == 'function' && exec(param, self);
    return value || (type == 'string' && string(param, monad));
  }

  // memoize namespace on monad so we can access the namespaced module, etc.
  monad.namespace = ns;

  // memoize the monad fn as 'define' on namespace to support lazy loading
  return ns.define = monad;
}

/*
 * parse, load, and away...
 * returns the collector monad function.
 */
function string(id, monad) {
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
    
    // still considering whether to use graph alias or not, or even "deep" or 
    // persistent aliases downstream
    //console.log('graph alias: ' + id + ' as ' + alias);
    
  } else {
    alias = camelize(id);
  }
  
  // handle required pathnames relative to the module, not monad file
  var filename = Module._resolveFilename(id, self.module);
  
  // cycles are discouraged
  var cycle = graph(self.module.id, filename).resolve(filename);
  assert(!cycle, cycle);  
  
  // get filename's exports
  var entry = registry[filename];
  
  if (!entry || !entry.module || !('exports' in entry.module)) {
    /*
     * using the real module require when:
     *
     * 1. the file is a node_module (like 'fs') or a commonjs module (not 
     *    using define()), so it has to be require()'d,
     * 2. it hasn't been loaded & registered at least once yet...
     */
    //console.log('using require: ' + filename);    
    entry = self.module.require(filename);
  } else {
    //console.log('registered: ' + filename);    
    entry = entry.module.exports;
  }
  
  // assign exports to alias
  if (globalName) {
    self[alias] = global[alias];
  } else {
    self[alias] = entry;
  }
  
  return monad;
}
