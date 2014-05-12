

// global

global = (typeof global != 'undefined' && global) || window;

assert(global, 'global not defined');


// find self
var scripts = document.scripts || document.getElementsByTagName('script');
var script = scripts[scripts.length - 1];

assert(script.getAttribute('data-monad') !== void 0, 'missing script data-attr');

global.__filename = script.src;
global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));


/*---------------------------------*/

// VERY REDUCED VERSION of node.js Module api and require() binding

function Module(id, parent) {
  // https://github.com/joyent/node/blob/master/lib/module.js#L37-L48
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

Module._cache = {};

Module._load = function(request, parent, isMain) {

  var filename = Module._resolveFilename(request, parent);

  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    return cachedModule.exports;
  }
  
  var module = new Module(filename, parent);
  
  Module._cache[filename] = module;
  
  var hadException = true;

  try {
    module.load(filename);
    hadException = false;
  } finally {
    if (hadException) {
      delete Module._cache[filename];
    }
  }

  return module.exports;
};

Module.prototype.load = function(filename) {

  assert(!this.loaded);
  this.filename = filename;

  // var extension = path.extname(filename) || '.js';
  // if (!Module._extensions[extension]) extension = '.js';
  // Module._extensions[extension](this, filename);
  this.loaded = true;
};

Module.prototype.require = function(path) {
  assert(typeof path == 'string', 'path must be a string');
  assert(path, 'missing path');
  return Module._load(path, this);
};

Module._resolveFilename = function(request, parent) {

  ///////////////////////////////////////////////
  //
  // TODO flesh this out correctly for the browser
  //
  ///////////////////////////////////////////////
  
  console.log(request);
  //console.log(parent.id)
  
  return request
};


///////////////////////////////////////////////
//
//  require() shim
//
///////////////////////////////////////////////

function require(id) {
  //console.log('require: ' + id);
  var filename = normalize(id);
  var cache = require._cache;
  
  cache[filename] || (cache[filename] = new Module(filename));
  
  return cache[filename].exports;
}

require._cache = Module._cache;


Module._load('module');
Module._cache['module'].exports = Module;

/*---------------------------------*/

// basepath

// page url information
var href = document.location.href;
document.location.search !== '' && (href = href.split(document.location.search)[0]);

global.BASEPATH = href.substring(0, href.lastIndexOf('/') + 1);

/*---------------------------------*/

// path normalizing

Module._load('normalize');
Module._cache['normalize'].exports = normalize;

var BLANK = '';
var SLASH = '/';
var DOT = '.';
var DOTS = DOT.concat(DOT);
var SCHEME = BASEPATH.split(document.location.host)[0];

function normalize(path) {

  if (!path || path == SLASH) {
    return SLASH
  }

  // for IE 6 & 7 - use path.charAt(i), not path[i]
  var prependSlash = (path.charAt(0) == SLASH || path.charAt(0) == DOT);
  var target = [];
  var src, scheme, token;

  if (path.indexOf(SCHEME) != -1) {
    scheme = path.split(SCHEME);
    src = scheme[1].split(SLASH);
  } else {
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

  return (scheme ? SCHEME : BLANK) + (prependSlash ? SLASH : BLANK) + result;
}

/*---------------------------------*/

//////////////////////////////////////////////////////
// SCRIPT ELEMENT LOADING API TO GO HERE
//
//
//
//////////////////////////////////////////////////////

if (document) {
  console.log('document script');
}

/*---------------------------------*/

// register builtin dependencies

// assert
Module._load('assert');
Module._cache['assert'].exports = assert;

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}



// camelize
Module._load('camelize');
Module._cache['camelize'].exports = camelize;

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

// make

// var assert = require('assert');

//module.exports = make;

Module._load('make');
Module._cache['make'].exports = make;

/*
 * make a new Function converting context properties to local varnames, and 
 * embed the given fn as an IIFE bound to context.module.exports.
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

/*
 * super simple dependency graph to track requests and keep cycles to a minimum
 */
//module.exports = graph;

Module._load('graph');
Module._cache['graph'].exports = graph;

/*
graph(id);
graph.items[id] = [];
graph(id, dep);
graph.items[id] = [dep];
graph.resolve(id);
*/

/*
 * maps id string if not mapped
 * maps dep string if not mapped
 * adds dep string to id map
 */
function graph(id, dep) {

  graph.as || (graph.as = as);
  graph.resolve || (graph.resolve = resolve);
  graph.items || (graph.items = {});
  
  var item;
  
  // memoizing registry
  !id || (item = graph.items[id] || (graph.items[id] = []));
  // add dep to id map;  [].push() returns new length
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));
    
  return graph;
}

/*
 * recursively visits id string map items
 * returns message string if a cycle is detected
 */
function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    return 'cycle: ' + visited.concat(id).join(' > ');
  }
  
  // [].push() returns new length
  visited[id] = visited[visited.push(id) - 1];

  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
    msg = resolve(deps[i], visited);
    if (msg) {
      return msg;
    }
  }
}

/*
// lookup
graph.as(id, alias);
graph.as.items[as] = { id: id, as: alias };
*/

function as(id, alias) {

  // memoizing registry
  return as[alias] || (as[alias] = { id: id, as: alias });
}


/*---------------------------------*/

// define + monad api

//var module = Module._cache[__filename];
Module._load(__filename);
Module._cache[__filename].exports = global.define = define;


var registry = {}; // holds namespaces
var stack = []; // tracks namespace execution and nesting


/*
 * entry point for defining a namespace and returning a collector function (or 
 * monad). resolves the id pathname with respect to THIS module and returns the 
 * monad.
 */

function define(id) {
  assert(typeof id == 'string', 'id must be string');
  
  var filename = Module._resolveFilename(id, Module._cache[__filename]);

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

/*---------------------------------*/

/*
 * manage calls to make() with a stack to prevent an inner exports from 
 * clobbering an outer exports.
 */
function exec(fn, monad) {
    
  /*
   * IN PROGRESS ~ STRATEGY TO BE IMPROVED
   * inner exports should not clobber outer exports.
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
    
    // still considering whether to use graph alias or not, or even "deep" or 
    // persistent aliases downstream
    //console.log('graph alias: ' + id + ' as ' + alias);
    
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
     *
     * 1. the file is a node_module (like 'fs') or a commonjs module that does  
     *    not use define()), so it has to be require()'d,
     * 2. it hasn't been loaded & registered at least once yet...
     */
    //console.log('using require: ' + filename);    
    exports = monad.module.require(filename);
  }
  
  /*
   * TODO - in browsers, use the async callback step for assignment.
   * 1. when a required global is loaded, we can use it synchronously in node. 
   * 2. otherwise exports retrieval should have worked, so assign that
   */

  monad[alias] = (globalName && global[alias]) || exports;
  
  return monad;
}


/*---------------------------------*/


(define)('assert')
(function() {
  module.exports = assert;
});

(define)('camelize')
(function() {
  module.exports = camelize;
});

(define)('graph')
(function() {
  module.exports = graph;
});

(define)('make')
(function() {
  module.exports = make;
});

(define)('module')
(function() {
  module.exports = Module;
});