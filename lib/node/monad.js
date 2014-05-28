// lib/node/monad
// 20-22 APRIL 2014 ! monadic version ! replaces lib/node/define spritzer
// 1 MAY 2014 ! graph !
// 5 MAY 2014 ! get rid of parent references !
// 6 MAY 2104 ! collapse namespace into monad !
// 8 MAY 2104 ! make exec local, make make() its own module !
// 9 MAY 2104 ! remove define.id, just use define(id) !

/*---------------------------------*/

var assert = require('./assert'); // 27 May 14
var Module = require('./module'); // 27 May 14
var camelize = require('./camelize');
var make = require('./make');
var graph = require('./graph');

//////////////////////////////////////////////////////

/*
 * registers the filename to monadic collector function which acts as a 
 * namespace that holds set of 'own' names to be written into scope as globals 
 * by the exec() function.  holds on to a real module.  though laborious, this 
 * solution repeats work done by environment in order to bind module.require() 
 * to the encapsulated module, and map the require.cache{} and require.resolve() 
 * api to the Module api.
 *
 * requires:  Module, assert, exec, string
 */
function namespace(filename) {

  // namespace is a loader; monad is a collector.
  var monad = namespace.monad();

  /*
   * memoize pseudo-global key-value pairs to the monad as 'own' properties to 
   * be to written into scope by the exec() function.
   */

  var context = monad.context = {};
  
  context.id = filename;
  context.__filename = filename;
  context.__dirname = namespace.dirname(filename);

  // load real module from cache
  context.module = namespace.retrieve(filename); 
  
  // 5 MAY 2014 - 'reimplement' require locally to get out of relying on parent
  context.require = function require(id) {
    return context.module.require(id);
  };
  
  context.require.resolve = function resolve(request) {
    return Module._resolveFilename(request, context.module);
  };
  
  context.require.cache = Module._cache;
  
  // memoize collector as 'define' on namespace to shadow out the global define.
  context.define = monad;
  
  return monad;
};

namespace.camelize = camelize;
namespace.graph = graph;
namespace.make = make;

/*
 * entry point for defining a namespace and returning a collector function (or 
 * monad). resolves the id pathname with respect to THIS module and returns the 
 * monad.
 *
 * requires:  assert, Module, graph, namespace
 */
namespace.define = function define(id) {
  assert(typeof id == 'string', 'id must be string');
  
  var filename = Module._resolveFilename(id);

  // track requests for cycle checking later
  namespace.graph(filename);
  
  var cache = define.cache || (define.cache = {});
  
  return cache[filename] || (cache[filename] = namespace(filename));
};

/*
 * factory method that returns a collector function for module definition data,
 * (i.e., dependency paths, aliases, and the scope function).  collector keeps 
 * returning itself until the scope function argument is passed.
 *
 * requires:  assert, namespace
 */
namespace.monad = function monad() {
  /*
   * 6 MAY 2014 - moved monad() here so as not to create if already registered.
   * return this collector function to process parameters on successive calls.
   *
   * requires:  assert, exec, string
   */
  return function monad(param) {
    var type = typeof param;
    var value;
    
    // handle invalid types...?
    assert(type.match(/string|function/), 'param must be string or function');
    
    value = type == 'function' && namespace.exec(param, monad);
    return value || (type == 'string' && namespace.string(param, monad));
  };
};

/*
 * make a new function from fn, passing keys in monad context as symbols.
 *
 * requires:  make, script if document
 */
namespace.exec = function exec(fn, monad) {

  //15 MAY 2014 ASYNC PENDING STRATEGY ADDED FOR BROWSER CASE 
  if (typeof script != 'undefined' && !script.ready(fn, monad)) {
    return;
  }
    
  // stack calls to make(), prevent inner exports clobbering outer exports
  var stack = exec.stack || (exec.stack = []);
  var context = monad.context;
  var module = context.module;
  var nested = stack[stack.length - 1] === context.id;
  var exports, result;
  
  !nested || ((exports = module.exports) && (module.exports = {}));
    
  stack.push(context.id);
  result = namespace.make(fn, context)(context);
  stack.pop(context.id);

  !nested || (module.exports = exports);
  
  return result;
};

/*
 * parse, load, and away...
 * 
 * LONG METHOD
 *
 * function accepts a string id and the memoizing collector monad function.
 * function processes the requested id for alias tokens, if any, camelCases the 
 * alias, loads the import from cache, adds alias to the monad and returns the 
 * monad.  function checks for circular dependencies and throws an error if one 
 * is detected.
 *
 * requires:  camelize, Module, graph, define.cache, assert, script if document
 */
namespace.string = function string(id, monad) {

  // SHOULD WE DO THIS?
  // id = id.replace(/^\s+|\s+$/gm, ''); // for browser, maybe
  id = id.replace(/\\/g, '/').trim();
  // OR FORCE USERS TO FORMAT CORRECTLY???

  var pair = id.split(':=');
  var context = monad.context;
  var alias, globalName, filename, cycle, entry, module, exports;
  
  if (pair.length > 1) {
  
    // var alias
    alias = pair[0].trim();
    id = pair[1].trim();
    
    // global alias
    globalName = alias.match(/\{[^\}]+\}/);
    globalName && (alias = globalName[0].replace(/\{|\}/g, ''));
    
    // id alias
    alias.indexOf('/') === -1 || (alias = namespace.camelize(alias));
    
  } else {
    alias = namespace.camelize(id);
  }

  // handle required pathnames relative to the module, not monad file
  filename = Module._resolveFilename(id, context.module);
  
  // cycles are forbidden, no matter what
  if (cycle = namespace.graph(context.module.id, filename).resolve(filename) ) {
    assert(!cycle, cycle);  
  }
  
  // get filename's exports
  entry = define.cache[filename];
  module = entry && entry.context && entry.context.module; // hmmm
  
  if (module && ('exports' in module)) {
  
    //console.log('registered: ' + filename);    
    exports = module.exports;
    
  } else {

    // HEART OF THE MATTER ~ BROWSER SCRIPT ELEMENT REQUEST    
    if (global.document) {
    
      script.request({
        filename: filename, 
        forId: context.module.id,
        onload: function (err, done) {
        
          /*
           * creates a closure on context, filename, alias, globalName, monad
           */
           
          if (!err) {
            console.log('---------------register-----------------------');
            var exports = define.cache[filename].context.module.exports;
            context[alias] = (globalName && global[alias]) || exports;
          }

          if (done) {
            namespace.exec(monad.fn, monad);
          }
        }
      });
      
      return monad;
    }
    
    /*
     * using the real module require when:
     * 1. we're not in the browser
     * 2. the file is a node_module (like 'fs') or a commonjs module that does  
     *    not use define(), so it has to be require()'d, and therefore...
     * 3. ...it hasn't been loaded & registered at least once yet
     */
    //console.log('using require: ' + filename);    
    exports = context.module.require(filename);
  }
  
  /*
   * node.js case:
   * 1. when a required global is loaded, we can use it synchronously in node. 
   * 2. otherwise exports retrieval should have worked, so assign that
   */
  context[alias] = (globalName && global[alias]) || exports;
  
  return monad;
};

/*
 * get the module out of the cache. load it if it's not there.
 *
 * requires:  Module
 */
namespace.retrieve = function retrieve(filename) {
  Module._cache[filename] || Module._load(filename);
  
  return Module._cache[filename];
};

/*
 * utility method returns the directory name for the given filename,
 * normalizing separator character to unix (forward slash).
 */
namespace.dirname = function dirname(filename) {
  var w = filename.lastIndexOf('\\'); // windows
  var u = filename.lastIndexOf('/'); // unix

  return filename.substring(0, w > u ? w : u);
};

//////////////////////////////////////////////////////

// pre-loading essentially, relying on hoisting
//retrieve(__filename).exports = global.define = define;
global.define = namespace.define;
(define)(__filename)
(function () {
  module.exports = global.define;
});
