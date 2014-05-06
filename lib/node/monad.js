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
 * registers the filename to monadic collector function which acts as a 
 * namespace that holds set of 'own' names to be written into scope as globals 
 * by the exec() function.  holds on to a real module.  though laborious, this 
 * solution repeats work done by environment in order to bind module.require() 
 * to the encapsulated module, and map the require.cache{} and require.resolve() 
 * api to the Module api.
 */
function monad(filename) {

  // return this collector function to process parameters on successive calls
  function self(param) {
    var type = typeof param;
    
    // handle invalid types...?
    
    var value = type == 'function' && exec(param, self);
    return value || (type == 'string' && string(param, self));
  }
    
  // memoize the collector fn as 'define' on namespace to support lazy loading
  self.define = self;
 
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

  // track requests for cycle checking later
  graph(filename);
  
  return registry[filename] = self;
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
         
  return define.id(__filename)(param); // THIS IS BAD ~ BINDS TO CURRENT FILE
}

/*
 * real entry point for declaring a namespace and returning the collector monad 
 * function. resolves the id pathname with respect to THIS module and returns 
 * the monad.
 */
define.id = function (id) {
  var filename = Module._resolveFilename(id, module);

  return registry[filename] || monad(filename);
}

/*
 * TODO: DOCUMENT THIS FUNCTION CLEARLY.
 * parse, load, and away...
 * processes the requested id, updates and returns the self monad
 */
function string(id, self) {
  // trim id string...
  // id = id.replace(/^\s+|\s+$/gm, '');
  id = id.trim();

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
  var exports;
  
  if (!entry || !entry.module || !('exports' in entry.module)) {
    /*
     * using the real module require when:
     *
     * 1. the file is a node_module (like 'fs') or a commonjs module (not 
     *    using define()), so it has to be require()'d,
     * 2. it hasn't been loaded & registered at least once yet...
     */
    //console.log('using require: ' + filename);    
    exports = self.module.require(filename);
  } else {
    //console.log('registered: ' + filename);    
    exports = entry.module.exports;
  }
  
  // assign exports to alias
  if (globalName) {
    self[alias] = global[alias];
  } else {
    self[alias] = exports;
  }
  
  return self;
}
