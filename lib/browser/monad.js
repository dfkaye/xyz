/////////////////////////////////////////////////////////////////
//
// TO DO as of 23 MAY --21, 16 MAY 2014--
//
//  - get rid of global state vars (main, scripts, script, etc.)
//
//  - strategy pattern for implementations of needed methods
//  - init module.exports cross-platform so we can re-use files
//    + Module._cache, Module._load, maybe in namespace.retrieve()
//
//  - encapsulate related methods into units, THEN expose the units
//  - string constants for normalize()
//  - move normalize into Module._resolveFilename???
//
//  - rename "monad" to "loader"
//
//  - rename exec to "load", put it on namespace.load
//  - rename string to "include", put it on namespace.include
//  - put camelize on namespace.camelize
//  - put graph on namespace.graph
//  - rename make to "sandbox", put it on namespace.sandbox
//  - expose namespace as define.namespace??
//  - enable var namespace = require('namespace');
//    + expose ns.load, ns.include, ns.alias??
//
//  - enable require('namespace')(__filename)(dependencyId)(function () {});
//    + sugar it as define(__filename)(dependencyId)(function () {});
//
//  - legacy browser support (trim, get rid of should.js for IE8, etc.)
//
//  - DONE fix basepath on file:// protocol
//  - DONE de-couple script.request from exec, use request.onload(err, done)
//  - DONE browser global.require - BUT MODULE MUST BE CACHEd, no remote request
//  - DONE add context member to monad (move keys from monad to context)
//  - DONE get rid of state vars (registry, stack)
//  - DONE move stack to exec.stack
//  - DONE move registry to define.cache
//  - DONE require() & module.require() (with tests)
//  - DONE normalize() on file:// protocol
//  - DONE zero in on the failed to load async deps properly (clobbering?)
//    + localhost + testem
//    + rawgithub
//
/////////////////////////////////////////////////////////////////

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

//////////////////////////////////////////////////////

/*
 * global
 *
 * requires:  assert, window, document, Module, graph, assert, script if document
 */
global = (typeof global != 'undefined' && global) || window;

assert(global, 'global not defined');

// find self
var scripts = document.scripts || document.getElementsByTagName('script');
var main = scripts[scripts.length - 1];

assert(main.getAttribute('data-monad') !== void 0, 'missing main data-attr');

global.__filename = main.src;
global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));
global.BASEPATH = document.location.href.substring(0, document.location.href.lastIndexOf('/') + 1);

//////////////////////////////////////////////////////
// normalize
// Module._load('normalize');
// Module._cache['normalize'].exports = normalize;

var BLANK = '';
var SLASH = '/';
var DOT = '.';
var DOTS = DOT.concat(DOT);
var fp = __dirname.match(/file\:[\/]{3,3}[a-zA-Z][\:]/);
var http = __dirname.match(/http[s]?\:[\/]{2,2}/);
var PREFIX = (fp && fp[0] || http && http[0]) + document.location.host;

function normalize(path) {

  if (!path || path == SLASH) {
    return SLASH
  }

  var target = [];
  var src, token;

  if (path.indexOf(PREFIX) !== -1) {
    // absolute path
    src = path.split(PREFIX)[1].split(SLASH);
  } else {
    // relative path
    src = path.split(SLASH);    
  }
  
  for (var i = 0; i < src.length; ++i) {

    token = src[i];

    if (token == DOTS) {
      target.pop();
    } else if (token != BLANK && token != DOT) {
      target.push(token);
    }
  }

  var result = target.join(SLASH).replace(/[\/]{2,}/g, SLASH);

  if (result.indexOf('.js') !== result.length - 3) {
    result = result + '.js';
  }
  
  return PREFIX + SLASH + result;
}

//////////////////////////////////////////////////////

/*
 * VERY REDUCED VERSION of node.js Module api and require() binding
 * see https://github.com/joyent/node/blob/master/lib/module.js
 *
 * requires:  assert, normalize, document.location.host, document.location.href
 */
function Module(id, parent) {
  this.id = id;
  this.exports = {};
  this.parent = parent;
  if (parent && parent.children) {
    parent.children.push(this);
  }

  this.filename = null;
  this.loaded = false;
  this.children = [];
}

// BROWSER VERSION
Module.prototype.load = function(filename) {
  assert(!this.loaded, 'module already loaded');
  this.filename = filename;
  this.loaded = true;
};

// NODE VERSION
Module.prototype.require = function(path) {
  assert(typeof path == 'string', 'path must be a string');
  assert(path, 'missing path');
  return Module._load(path, this);
};

// NODE VERSION
Module._cache = {};

// BROWSER VERSION
Module._load = function(request, parent, isMain) {
  var filename = Module._resolveFilename(request, parent);
  var module = Module._cache[filename] || 
                (Module._cache[filename] = new Module(filename, parent));
                
  if (!module.loaded) {
    try {
      module.load(filename);
      hadException = false;
    } finally {
      if (hadException) {
        delete Module._cache[filename];
      }
    }
  }
  
  return module.exports;
};

// BROWSER VERSION
Module._resolveFilename = function(request, parent) {

  if (request.indexOf(document.location.host) > 0) {
    // absolute path needs no parent resolution
    return normalize(request);
  }
  
  // HREF + '/' IS A HACK FOR ../../../pathnames...
  var parentId = (!!parent ? parent.id : document.location.href + '/');
  var sepIndex = parentId.lastIndexOf('/');
  
  if (sepIndex != -1) {
    parentId = parentId.substring(0, sepIndex + 1);
  }
    
  return normalize(parentId + request);
};

//////////////////////////////////////////////////////

/*
 * GLOBAL REQUIRE HACK
 * defines a global.require function if not already defined.
 * the new version returns module only if already cached
 *
 * requires:  Module
 */
global.require || (function() {

  global.require = function require(request) {
    var id = require.resolve(request);
    return require.cache[id] && require.cache[id].exports;
  };
  
  global.require.resolve = function resolve(request) {
    return Module._resolveFilename(request);
  };
  
  global.require.cache = Module._cache;
  
}());

//////////////////////////////////////////////////////
// script
// Module._load('script');
// Module._cache['script'].exports = script;

/*
 * api for dom script element requests 
 *
 *  ready, request, load, attach, & callback to request
 *
 * requires: main.parentNode, assert
 */
var script = {};

/*
 * are all deferred dependencies available?
 */
script.ready = function ready(fn, monad) {

  var p = script.pending && script.pending[monad.context.module.id];
  
  if (p && p.length > 0) {
  
    // memoize the fn so that exec() can get to it
    monad.fn || (monad.fn = fn);
    
  } else {
  
    // don't expose fn as a symbol to make()
    delete monad.fn;
  }
  
  return !monad.fn;
};

/*
 * fetch dependencies via htmlscriptelement
 * 
 */
script.request  = function require(request) {

  //console.log('---------------script.request-----------------------');

  assert(request.filename, 'script.request: missing request.filename property');
  assert(request.forId, 'script.request: missing request.forId property');
  assert(request.onload, 'script.request: missing onload callback');
  
  var filename = request.filename;
  var id = request.forId;

  // script.pending is created only if script.request is called
  var pending = script.pending || (script.pending = []);
  
  pending[id] || (pending[id] = []);
  pending[id].push(request);
  
  script.load(request.filename, function callback(err) {
    script.pending[id].pop();
    request.onload(err, pending[id].length < 1);
  });
};

/*
 * new HTMLScriptElement
 */
script.attach = function attach(src, callback) {

  //console.log('---------------script.attach-----------------------');
  
  // callback required - 
  assert(typeof callback == 'function', 'attach callback required');
  
  var s = document.createElement('script');

  s.onload = s.onreadystatechange = function (e) {   
    var rs = s.readyState;
    if (!rs || rs == 'loaded' || rs == 'complete') {
      s.onload = s.onreadystatechange = null;
      callback();
    }
  };
  
  /*
   * for more info about errors see
   * http://www.quirksmode.org/dom/events/error.html
   */
  s.onerror = function (e) {
    callback({ type: 'error', message: 'file not found:' + src });
  };

  s.src = src;
  
  //////////////////////////////////////////////
  // 
  // TODO: better declaration and handle for main and parentNode
  //
  //////////////////////////////////////////////
  main.parentNode.appendChild(s);  
  return s;
};

/*
 *  Steve Souders' ControlJS style of script caching
 */
script.load = function load(src, callback) {

  //console.log('---------------script.load-----------------------');

  // callback required - 
  assert(typeof callback == 'function', 'script callback required');

  script.cache || (script.cache = {});
  
  (script.cache[src] && script.attach(src, callback)) || (function () {
    var img = new Image();
    
    /*
     * onerror is always executed by browsers that receive js text instead of 
     * the expected img type, so ignore that and delegate to attach() which will 
     * handle bad url errors.
     */
    img.onerror = img.onload = function (e) {
      script.attach(src, callback); 
    };
    
    img.src = src;
    script.cache[src] = img;
  }());
};

//////////////////////////////////////////////////////
// camelize
// Module._load('camelize');
// Module._cache['camelize'].exports = camelize;

var RE_SEP = /\-|\./;
var RE_SEP_AZ = /(\-|\.)[a-z]/;
var RE_SEP_AZ_G = /(\-|\.)[a-z]/g;
var RE_WS = /[\s]+/g;
var BLANK = '';
var RE_WIN_SEP = /\\/g;

//module.exports = camelize;

function camelize(name) {

  var ext = BLANK;
  var id, match, ch, i;
    
  if (name.indexOf('.') > 0) {
    ext = name.substring(name.lastIndexOf('.'), name.length);
  }
  
  // replace windows backslash separators
  id = name.replace(RE_WIN_SEP, '/').split('/').slice(-1)[0];
  id = id.substring(0, id.lastIndexOf(ext));
    
  if (match = id.match(RE_SEP_AZ_G)) {
    for (i = 0; i < match.length; i++) {
      ch = match[i].replace(RE_SEP, BLANK).toUpperCase();
      id = id.replace(RE_SEP_AZ, ch);
    }
  }
  
  return (id.substring(0, id.lastIndexOf('.')) || id).replace(RE_WS, BLANK);
}

//////////////////////////////////////////////////////
// make
// Module._load('make');
// Module._cache['make'].exports = make;

/*
 * make a new Function converting context properties to local varnames, and 
 * embed the given fn as an IIFE bound to context.module.exports.
 *
 * requires: assert
 */
function make(fn, context) {
  assert(arguments.length === 2, 'make: requires fn and context arguments.');
  assert(typeof fn == 'function', 'make: fn should be a function.');
  assert(context, 'make: context is not defined.');
  assert(context.module, 'make: module is not defined.');
  assert('exports' in context.module, 'make: module.exports is not defined.');

  var code = '  "use strict";\r\n  ';
  var k, f;

  code = code + '/* ' + context.filename + ' */ \r\n  ';

  for (var k in context) {
    if (context.hasOwnProperty(k) && k !== 'id') {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';
  
  // remove load method which should only be used by environment loader
  code = code + 'module.load = undefined;\r\n  ';
  
  // prevent context leakage
  'context' in context || (code = code + 'context = undefined;\r\n  ');

  code = code + '\r\n  (' + fn.toString() + ').call(exports);\r\n  ' +
         'return module.exports;';

  return Function('context', code);
}

//////////////////////////////////////////////////////
// graph
// Module._load('graph');
// Module._cache['graph'].exports = graph;

/*
 * super simple dependency graph to track requests and keep cycles to a minimum
 */
/*
graph(id);
graph.items[id] = [];
graph(id, dep);
graph.items[id] = [dep];
graph.resolve(id);
note that [].push() returns new length
*/

/*
 * memoizing registry
 * maps id string if not mapped
 * maps dep string if not mapped
 * adds dep string to id map
 */
function graph(id, dep) {

  graph.resolve || (graph.resolve = resolve);
  graph.items || (graph.items = {});
  
  var item;
  
  !id || (item = graph.items[id] || (graph.items[id] = []));
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));
    
  return graph;
}

/*
 * recursively visits id string map items, depth first.
 * returns message string if a cycle is detected
 */
graph.resolve = function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    return 'cycle: ' + visited.concat(id).join(' > ');
  }
  
  visited[id] = visited[visited.push(id) - 1];

  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
    msg = resolve(deps[i], visited);
    if (msg) {
      return msg;
    }
  }
}

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
    
    value = type == 'function' && namespace.load(param, monad);
    return value || (type == 'string' && namespace.string(param, monad));
  };
};

/*
 * make a new function from fn, passing keys in monad as symbols.
 *
 * requires:  make, script if document
 */
namespace.load = function exec(fn, monad) {

  /*
   * 15 MAY 2014
   * ASYNC PENDING STRATEGY ADDED FOR BROWSER CASE 
   */
  if (typeof script != 'undefined' && !script.ready(fn, monad)) {
    return;
  }
    
  /*
   * manage calls to make() with a stack to prevent an inner exports from 
   * clobbering an outer exports.
   */
  var stack = exec.stack || (exec.stack = []);
  var context = monad.context;
  var nested = stack[stack.length - 1] === context.id;
  var exports, result;
  
  !nested || ((exports = context.module.exports) && (context.module.exports = {}));
    
  stack.push(context.id);
  result = make(fn, context)(context);
  stack.pop(context.id);

  !nested || (context.module.exports = exports);
  
  return result;
};

/*
 * parse, load, and away...
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
    alias.indexOf('/') === -1 || (alias = camelize(alias));
    
  } else {
    alias = camelize(id);
  }

  // handle required pathnames relative to the module, not monad file
  filename = Module._resolveFilename(id, context.module);
  
  // cycles are forbidden, no matter what
  if (cycle = graph(context.module.id, filename).resolve(filename) ) {
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
        
          if (!err) {
            console.log('---------------register-----------------------');
            var exports = define.cache[filename].context.module.exports;
            context[alias] = (globalName && global[alias]) || exports;
          }

          if (done) {
            namespace.load(monad.fn, monad);
          }
        }
      });
      
      return monad;
    }
    
    /*
     * using the real module require when:
     * 1. we're not in the browser
     * 2. the file is a node_module (like 'fs') or a commonjs module that does  
     *    not use define()), so it has to be require()'d
     * 3. it hasn't been loaded & registered at least once yet
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
  
  return Module._cache[filename] ;
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
 *
 * requires:  assert, Module, graph, namespace
 */
function define(id) {
  assert(typeof id == 'string', 'id must be string');
  
  var filename = Module._resolveFilename(id);

  // track requests for cycle checking later
  graph(filename);
  
  var cache = define.cache || (define.cache = {});
  
  return cache[filename] || (cache[filename] = namespace(filename));
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