
// global

/////////////////////////////////////////////////////////////////
//
// TO DO as of 16 MAY 2014
//
//  - require() (with tests)
//  - init module.exports cross-platform so we can re-use files
//  - normalize() on file:// protocol
//  - fix basepath on file:// protocol
//  - zero in on the failed to load async deps properly (probably clobbering)
//    + localhost + testem
//    + rawgithub
//  - encapsulate related methods into units, and globalize the units
//
/////////////////////////////////////////////////////////////////

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

//////////////////////////////////////////////////////

global = (typeof global != 'undefined' && global) || window;

assert(global, 'global not defined');

// find self
var scripts = document.scripts || document.getElementsByTagName('script');
var main = scripts[scripts.length - 1];

assert(main.getAttribute('data-monad') !== void 0, 'missing main data-attr');

global.__filename = main.src;
global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));
global.BASEPATH = document.location.href.substring(0, document.location.href.lastIndexOf('/') + 1);

/*---------------------------------*/

// path normalizing

// Module._load('normalize');
// Module._cache['normalize'].exports = normalize;

var BLANK = '';
var SLASH = '/';
var DOT = '.';
var DOTS = DOT.concat(DOT);

////////////////////////////////////////////////////////////////////
// 
var fp = __dirname.match(/file\:[\/]{3,3}[a-zA-Z][\:]/);
var http = __dirname.match(/http[s]?\:[\/]{2,2}/);
var PREFIX = (fp && fp[0] || http && http[0]) + document.location.host;
var ROOT = document.location.href.split(PREFIX)[1];
var BASEDIR = ROOT.substring(0, ROOT.lastIndexOf(SLASH) + 1);
//
////////////////////////////////////////////////////////////////////

function normalize(path) {

  if (!path || path == SLASH) {
    return SLASH
  }
  
  // for IE 6 & 7 - use path.charAt(i), not path[i]
  //var prependSlash = (protocol == 'file:');
  var target = [];
  var src, pair, token;

  if (path.indexOf(PREFIX) != -1) {
    pair = path.split(PREFIX);
    src = pair[1].split(SLASH);
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

  //console.log('normalized: ' + path + ' as ' + PREFIX + SLASH + result);
  
  return PREFIX + SLASH + result;
}

//////////////////////////////////////////////////////

// VERY REDUCED VERSION of node.js Module api and require() binding
// https://github.com/joyent/node/blob/master/lib/module.js
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
  assert(!this.loaded);
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

// BROWSER VERSION
Module._resolveFilename = function(request, parent) {

  //console.log('resolve: %s for %s', request, (parent || ''));

  if (request.indexOf(PREFIX) === 0) {
    return normalize(request);
  }
  
  // THINK THE HREF + / IS A HACK FOR ../../../pathnames...
  var parentId = (!!parent ? parent.id : document.location.href + '/');
  var sepIndex = parentId.lastIndexOf('/');
  
  if (sepIndex != -1) {
    parentId = parentId.substring(0, sepIndex + 1);
  }
  
  //console.warn(parentId);
  
  return normalize(parentId + request);
};


/////////////////////////////////////////////////////////////////////////////
//
// script request management IN PROGRESS
//  load, script, attach, callback to load
/////////////////////////////////////////////////////////////////////////////

/*
 * fetch dependencies via htmlscriptelement
 */
function load(request) {

  console.log('---------------load-----------------------');

  assert(request.monad, 'load() requires request.monad property');
  assert(request.filename, 'load() requires request.filename property');
  assert(request.alias, 'load() requires request.alias property');

  var filename = request.filename;
  var alias = request.alias;
  var globalName = request.globalName;
  var monad = request.monad;

  pending[monad.module.id] || (pending[monad.module.id] = []);
  pending[monad.module.id].push(request);
  
  script(request.filename, function callback(err) {
  
    var exports;
    
    pending[monad.module.id].pop();

    if (!err) {
      console.log('---------------register-----------------------');
    
      // filename dependency footgun
      exports = registry[filename].module.exports;
      monad[alias] = (globalName && global[alias]) || exports;
    }

    if (pending[monad.module.id].length < 1) {
      exec(monad.fn, monad);
    }
  });
}

/*
 *  Steve Souders' ControlJS style of script caching
 */
function script(src, callback) {
  // callback required - 
  assert(typeof callback == 'function', 'script callback required');

  console.log('---------------script-----------------------');

  script.cache || (script.cache = {});
  
  (script.cache[src] && attach(src, callback)) || (function () {
    var img = new Image();
    
    /*
     * onerror is always executed by browsers that receive js text instead of 
     * the expected img type, so ignore that and delegate to attach() which will 
     * handle bad url errors.
     */
    img.onerror = img.onload = function (e) {
      attach(src, callback); 
    };
    
    img.src = src;
    script.cache[src] = img;
  }());
}

/*
 * new HTMLScriptElement
 */
function attach(src, callback) {

  console.log('---------------attach-----------------------');
  
  // callback required - 
  assert(typeof callback == 'function', 'attach callback required');
  
  var s = document.createElement('script');

  s.onload = s.onreadystatechange = function (e) {   
    var rs = s.readyState;
    if (!rs || rs == 'loaded' || rs == 'complete') {
    
      // console.warn('ok: ' + src);
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

//////////////////////////////////////////////////////

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
function resolve(id, visited) {

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
 * get the module out of the cache. load it if it's not there.
 */
function retrieve(filename) {
  Module._cache[filename] || Module._load(filename);
  
  return Module._cache[filename] ;
}

/*---------------------------------*/

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
     * HEART OF THE MATTER ~ BROWSER SCRIPT ELEMENT REQUEST
    */
    
    if (global.document) {
    
      load({
        filename: filename, alias: alias, globalName: globalName, monad: monad
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
    exports = monad.module.require(filename);
  }
  
  /*
   * node.js case:
   * 1. when a required global is loaded, we can use it synchronously in node. 
   * 2. otherwise exports retrieval should have worked, so assign that
   */
  monad[alias] = (globalName && global[alias]) || exports;
  
  return monad;
}