// lib/node/monad
// 20-22 APRIL 2014 ! monadic version ! replaces lib/node/define spritzer
// 1 MAY 2014 ! graph !
// 5 MAY 2014 ! get rid of parent references !
// 6 MAY 2104 ! collapse namespace into monad !
// 8 MAY 2104 ! make exec local, make make() its own module !
// 9 MAY 2104 ! remove define.id, just use define(id) !

/*---------------------------------*/

// this is really intended for browser
function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

var camelize = require('./camelize');
var make = require('./make');
var graph = require('./graph');

//var Module = module.constructor; // <= stay out of other processes

var Module = require('module');

//////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////

// STATE

var registry = {};
var stack = [];
var pending = [];

//////////////////////////////////////////////////////


// pre-loading essentially, relying on hoisting
//retrieve(__filename).exports = global.define = define;
global.define = define;
(define)(__filename)
(function () {
  module.exports = global.define;
});


/*---------------------------------*/

/*
 * entry point for defining a namespace and returning a collector function (or 
 * monad). resolves the id pathname with respect to THIS module and returns the 
 * monad.
 */
function define(id) {
  assert(typeof id == 'string', 'id must be string');
  
  var filename = Module._resolveFilename(id);

  // track requests for cycle checking later
  graph(filename);
  
  return registry[filename] || (registry[filename] = namespace(filename));
}

/*---------------------------------*/

/*
 * registers the filename to monadic collector function which acts as a 
 * namespace that holds set of 'own' names to be written into scope as globals 
 * by the exec() function.  holds on to a real module.  though laborious, this 
 * solution repeats work done by environment in order to bind module.require() 
 * to the encapsulated module, and map the require.cache{} and require.resolve() 
 * api to the Module api.
 */
function namespace(filename) {

  /*
   * 6 MAY 2014 - moved monad() here so as not to create if already registered.
   * return this collector function to process parameters on successive calls.
   */
   
  function monad(param) {
    var type = typeof param;
    var value;
    
    // handle invalid types...?
    assert(type.match(/string|function/), 'param must be string or function');
    
    value = type == 'function' && exec(param, monad);
    return value || (type == 'string' && string(param, monad));
  }

  /*
   * memoize pseudo-global key-value pairs to the monad as 'own' properties to 
   * be to written into scope by the exec() function.
   */

  monad.id = filename;
  monad.__filename = filename;
  monad.__dirname = dirname(filename);

  // load real module from cache
  monad.module = retrieve(filename); 
  
  // 5 MAY 2014 - 'reimplement' require locally to get out of relying on parent
  monad.require = function require(id) {
    return monad.module.require(id);
  };
  monad.require.resolve = function resolve(request) {
    return Module._resolveFilename(request, monad.module);
  };
  monad.require.cache = Module._cache;
  
  /*
   * memoize the collector fn as 'define' on namespace to shadow out the real 
   * define function, and to support lazy loading (eventually).
   */
  monad.define = monad;
  
  return monad;
}

/*---------------------------------*/

/*
 * make a new function from fn, passing keys in monad as symbols.
 */
function exec(fn, monad) {

  /*
   * 15 MAY 2014
   * ASYNC PENDING STRATEGY ADDED FOR BROWSER CASE 
   */
  if (!ready(fn, monad)) {
    return;
  }
  
  /*
   * manage calls to make() with a stack to prevent an inner exports from 
   * clobbering an outer exports.
   */
  var nested = stack[stack.length - 1] === monad.id;
  var exports, result;
  
  !nested || ((exports = monad.module.exports) && (monad.module.exports = {}));
    
  stack.push(monad.id);
  result = make(fn, monad)(monad);
  stack.pop(monad.id);

  !nested || (monad.module.exports = exports);
  
  return result;
}

/*---------------------------------*/

/*
 * are all deferred dependencies available?
 */
function ready(fn, monad) {

  var p = pending[monad.module.id];
  
  if (p && p.length > 0) {
  
    // memoize the fn so that load() can get to it
    monad.fn || (monad.fn = fn);
  } else {
  
    // don't expose fn as a symbol to make()
    delete monad.fn;
  }
  
  return !monad.fn;
}

/*---------------------------------*/

/*
 * parse, load, and away...
 * 
 * function accepts a string id and the memoizing collector monad function.
 * function processes the requested id for alias tokens, if any, camelCases the 
 * alias, loads the import from cache, adds alias to the monad and returns the 
 * monad.  function checks for circular dependencies and throws an error if one 
 * is detected. 
 */
function string(id, monad) {

  // SHOULD WE DO THIS?
  // id = id.replace(/^\s+|\s+$/gm, ''); // for browser, maybe
  id = id.replace(/\\/g, '/').trim();
  // OR FORCE USERS TO FORMAT CORRECTLY???

  var pair = id.split(':=');
  var alias, globalName, filename, cycle, entry, exports;
  
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

  // handle required pathnames relative to the module, not monad file
  filename = Module._resolveFilename(id, monad.module);
  
  // cycles are forbidden, no matter what
  if (cycle = graph(monad.module.id, filename).resolve(filename) ) {
    assert(!cycle, cycle);  
  }
  
  // get filename's exports
  entry = registry[filename];
  
  if (entry && entry.module && ('exports' in entry.module)) {
  
    //console.log('registered: ' + filename);    
    exports = entry.module.exports;
    
  } else {
  
    /*
     * using the real module require when:
     * 1. the file is a node_module (like 'fs') or a commonjs module that does  
     *    not use define()), so it has to be require()'d,
     * 2. it hasn't been loaded & registered at least once yet...
     */
    //console.log('using require: ' + filename);    
    exports = monad.module.require(filename);
    
    ////////////////////////////////
    //
    //  HEART OF THE MATTER ~ ASYNC REQUEST
    // do the above require trick to create an entry in the modules cache so we 
    // don't keep looking for it
    //
    //////////////////////////////
    
    global.document && !registry[filename] && load({
      filename: filename, alias: alias, globalName: globalName, monad: monad
    });
  }
  
  
  /*
   * node.js case:
   * 1. when a required global is loaded, we can use it synchronously in node. 
   * 2. otherwise exports retrieval should have worked, so assign that
   */  
  monad[alias] = (globalName && global[alias]) || exports;
  
  return monad;
}

/*---------------------------------*/



// (define)('assert')
// (function() {
  // module.exports = assert;
// });

// (define)('camelize')
// (function() {
  // module.exports = camelize;
// });

// (define)('graph')
// (function() {
  // module.exports = graph;
// });

// (define)('make')
// (function() {
  // module.exports = make;
// });

// (define)('module')
// (function() {
  // module.exports = Module;
// });