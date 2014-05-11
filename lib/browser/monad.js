
// base work starts here

// global

global = (typeof global != 'undefined' && global) || window;

assert(global, 'global not defined');

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

// find self
var scripts = document.scripts || document.getElementsByTagName('script');
var script = scripts[scripts.length - 1];

assert(script.getAttribute('data-monad') !== void 0, 'missing script data-attr');

global.__filename = script.src;
global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));

// page url information
var href = document.location.href.split(document.location.search)[0];
global.BASEPATH = href.substring(0, href.lastIndexOf('/') + 1);

// path normalizing
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

/*-----*/
function string(param, monad) {
  console.log(param);
  return monad;
}

function exec(param, monad) {
  console.log(param);
  return {};
}

function graph(id) {
  console.log('graph called: ' + id);
};

var registry = {};

function define(id) {
  assert(typeof id == 'string', 'id must be string');
  
  var filename = Module._resolveFilename(id, Module._cache[__filename]);

  // track requests for cycle checking later
  graph(filename);
  
  return registry[filename] || (registry[filename] = namespace(filename));  
}

/* ---------------- */

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

/* ---------------- */


// require binding
// fake module implementation
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
  
  // more todo
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
// TODO
  console.log(request);
  //console.log(parent.id)
  
  return request
};

// cacheing

// requesting
function require(id) {
  //console.log('require: ' + id);
  var filename = normalize(id);
  var cache = require._cache;
  
  cache[filename] || (cache[filename] = new Module(filename));
  
  return cache[filename].exports;
}

require._cache = Module._cache;
// aliasing
// resolving
// executing