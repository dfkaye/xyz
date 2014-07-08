/*
 * browser.js polyfill for global, string#trim, assert, path.normalize, Module, 
 * require, plus a script loader for asynchronous requests.
 *
 * 'assert', 'module', 'path' and 'script' are registered into the module system 
 * polyfill at the bottom of this file.
 */
global = (typeof global != 'undefined' && global) || window;

!global.document || (function () {

  //////////////////////////////////////////////////////
  
  function assert(ok, message) {
    ok || (function (msg) {
      throw new Error(msg);
    }(message));
  }

  assert(global, 'global not defined');

  //////////////////////////////////////////////////////

  // string#trim polyfill
  typeof String.prototype.trim == 'function' ||
  (String.prototype.trim = function trim() {
    return this.replace(/^\s+|\s+$/gm, '');
  });

  //////////////////////////////////////////////////////

  // find self
  var scripts = document.scripts || document.getElementsByTagName('script');
  var main = scripts[scripts.length - 1];
  var href = document.location.href;

  assert(main.getAttribute('data-monad') !== void 0, 'missing main data-attr');

  global.__filename = main.src;
  global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));
  global.BASEPATH = href.substring(0, href.lastIndexOf('/') + 1);
  
  //////////////////////////////////////////////////////

  /*
   * script api for dom script element requests:
   * script(request), ready, load, attach, & callback to request
   * script.pending is created only if script(request) is called
   *
   * requires: main.parentNode, assert
   */

  /*
   * fetch dependencies via htmlscriptelement
   */
  function script(request) {
    assert(request.filename, 'script.request: missing filename property');
    assert(request.parent, 'script.request: missing parent property');
    assert(request.onload, 'script.request: missing onload callback');

    var filename = request.filename;
    var id = request.parent.id;
    var pending = script.pending || (script.pending = []);

    pending[id] || (pending[id] = []);
    pending[id].push(request);

    script.load(filename, function callback(err) {
      script.pending[id].pop();
      request.onload(err, pending[id].length < 1);
    });
  };

  /*
   * are all deferred dependencies available?
   */
  script.ready = function ready(fn, monad) {

    var p = script.pending && script.pending[monad.context.module.id];

    if (p && p.length > 0) {
      // memoize fn so that namespace.string() request callback can check it
      monad.fn || (monad.fn = fn);
    } else {
      // don't expose fn as a symbol to make()
      delete monad.fn;
    }

    return !monad.fn;
  };

  /*
   * new HTMLScriptElement
   */
  script.attach = function attach(src, callback) {
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
      callback({ type: 'error', message: 'file not found: ' + src });
    };

    s.src = src;

    main.parentNode.appendChild(s);

    return s;
  };

  /*
   *  Steve Souders' ControlJS style of script caching
   */
  script.load = function load(src, callback) {
    assert(typeof callback == 'function', 'script callback required');

    script.cache || (script.cache = {});

    (script.cache[src] && script.attach(src, callback)) || (function () {

      var img = new Image();

      /*
       * onerror is always executed by browsers that receive js text instead of
       * the expected img type, so ignore that and delegate to attach() which
       * will handle bad url errors.
       */
      img.onerror = img.onload = function (e) {
        script.attach(src, callback);
      };

      img.src = src;
      script.cache[src] = img;
    }());
  };
  
  //////////////////////////////////////////////////////

  /*
   * BROWSER VERSION of node.js 'path' module with normalize() method
   *
   * https://github.com/joyent/node/blob/f1dc55d7018e2669550a8be2c5b6c091da616483/lib/path.js
   *
   * requires: document.location
   */
  var path = {};
  
  path.normalize = function normalize(path) {
  
    var SLASH = '/';
    var PREFIX = document.location.protocol + '//' + document.location.host;
    
    if (!path || path == SLASH) {
      return PREFIX + SLASH;
    }

    var absolute = path.indexOf(PREFIX) !== -1;
    var target = [];
    var src, token, str;

    if (absolute) {
      src = path.split(PREFIX)[1].split(SLASH);
    } else {
      src = path.split(SLASH);
    }

    for (var i = 0; i < src.length; ++i) {
      token = src[i];

      if (token == '..') {
        target.pop();
      } else if (token != '' && token != '.') {
        target.push(token);
      }
    }

    return PREFIX + SLASH + target.join(SLASH).replace(/[\/]{2,}/g, SLASH);
  };

  //////////////////////////////////////////////////////

  /*
   * VERY REDUCED VERSION of node.js Module api and require() binding
   *
   * https://github.com/joyent/node/blob/f1dc55d7018e2669550a8be2c5b6c091da616483/lib/module.js
   *
   * requires:  assert, path.normalize, document.location
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

    var id = Module._resolveFilename(request, parent);

    Module._cache[id] || (Module._cache[id] = new Module(id, parent));

    var module = Module._cache[id];

    if (!module.loaded) {
      try {
        module.load(id);
        hadException = false;
      } finally {
        if (hadException) {
          delete Module._cache[id];
        }
      }
    }

    return module.exports;
  };

  // BROWSER VERSION
  Module._resolveFilename = function(request, parent) {
    assert(typeof request == 'string', 'resolve: request must be a string');
    
    var str, parentId, sepIndex;
    
    if (request.length && request.indexOf('/') === -1 && 
        request.indexOf('.') === -1) {
    
      // builtin or 'node_module' type
      return request;
    } 
    
    if (request.indexOf(document.location.protocol) === 0) {
    
      // absolute path needs no parent resolution
      str = path.normalize(request);
      
    } else {

      // href as dirname corrects relative ../../../pathnames
      parentId = (!!parent ? parent.id : document.location.href + '/');
      sepIndex = parentId.lastIndexOf('/');

      if (sepIndex != -1) {
        parentId = parentId.substring(0, sepIndex + 1);
      }
      
      (request && request.length > 0) || (request = '/');
      str = path.normalize(parentId + request);
    }
    
    if (str.indexOf('.js') !== str.length - 3) {
      str = str + '.js';
    }

    return str;    
  };

  //////////////////////////////////////////////////////

  /*
   * GLOBAL REQUIRE
   * defines a global.require function if not already defined.
   * the new version returns module exports only if module is already cached.
   *
   * requires:  Module
   */
  global.require || (function() {

    global.require = function require(request) {

      var id = require.resolve(request);

      return require.cache[id] && require.cache[id].exports;
    };

    global.require.resolve = function resolve(request) {
      return Module._resolveFilename(request); // no self arg in browser version
    };

    global.require.cache = Module._cache;

  }());

  //////////////////////////////////////////////////////

  /*
   * pre-register the 'builtin' browser modules
   */

  // publish assert
  var assertID = Module._resolveFilename('assert');
  Module._load(assertID);
  Module._cache[assertID].exports = assert;

  // publish Module
  var moduleID = Module._resolveFilename('module');
  Module._load(moduleID);
  Module._cache[moduleID].exports = Module;

    // publish path
  var pathID = Module._resolveFilename('path');
  Module._load(pathID);
  Module._cache[pathID].exports = path;
  
  // publish script
  var scriptID = Module._resolveFilename('script');
  Module._load(scriptID);
  Module._cache[scriptID].exports = script;

}());

/*----------------------------------------------------------------------------*/
// lib/node/monad

var assert = require('assert');
var Module = require('module');

/*
 * entry point for defining a namespace and returning a collector function (or
 * monad). resolves the id pathname with respect to THIS module and returns the
 * monad.
 *
 * requires:  assert, Module, graph, namespace
 */
global.define = function define(id) {
  assert(typeof id == 'string', 'id must be string');

  var filename = Module._resolveFilename(id);

  // track requests for cycle checking later
  define.graph(filename);

  var cache = define.cache || (define.cache = {});

  return cache[filename] || (cache[filename] = define.namespace(filename));
};

/*
 * registers the filename to monadic collector function which acts as a
 * namespace that holds set of names in a context to be written into scope as
 * pseudo-globals by the exec() function.  holds on to a real module.

 * though laborious, this solution repeats work done by environment in order to
 * bind module.require() to the encapsulated module, and map the require.cache{}
 * and require.resolve() methods to the Module api.
 *
 * requires:  Module
 */
define.namespace = function namespace(filename) {

  // namespace is a loader; monad is a collector.
  var monad = define.monad();

  /*
   * memoize pseudo-global key-value pairs to the monad as 'own' properties to
   * be to written into scope by the exec() function.
   */

  var context = monad.context = {};

  context.id = filename;
  context.__filename = filename;
  context.__dirname = define.dirname(filename);

  // get real module from cache. load it if it's not there.
  Module._cache[filename] || Module._load(filename);
  context.module = Module._cache[filename];

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

/*
 *  convert pathnames to a camelCase alias
 */
define.camelize = function camelize(name) {

  var RE_SEP = /\-|\./;
  var RE_SEP_AZ = /(\-|\.)[a-z]/;
  var RE_SEP_AZ_G = /(\-|\.)[a-z]/g;
  var RE_WS = /[\s]+/g;
  var BLANK = '';
  var RE_WIN_SEP = /\\/g;
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
};

/*
 * super simple dependency graph, uses memoizing registry for dependency map.
 */
define.graph = function graph(id, dep) {

  graph.resolve || (graph.resolve = define.resolve);
  graph.items || (graph.items = {});

  var item;
  
  // map id string if not mapped
  !id || (item = graph.items[id] || (graph.items[id] = []));
  // map dep string if not mapped, and add dep string to id map
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));

  return graph;
};

/*
 * recursively visits graph's item map, depth first.
 * returns message string only if a cycle is detected.
 */
define.resolve = function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    throw new Error('cycle: ' + visited.concat(id).join(' > '));
  }

  visited[id] = visited[visited.push(id) - 1];

  var graph = define.graph;

  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
    resolve(deps[i], visited);
  }
};

/*
 * make a new Function converting context properties to local varnames, and
 * embed the given fn as an IIFE bound to context.module.exports.
 */
define.make = function make(fn, context) {
  assert(arguments.length === 2, 'make: requires fn and context arguments.');
  assert(typeof fn == 'function', 'make: fn should be a function.');
  assert(context, 'make: context is not defined.');
  assert(context.module, 'make: module is not defined.');
  assert('exports' in context.module, 'make: module.exports is not defined.');

  var code = '  "use strict";\r\n  ';
  var k, f;

  code = code + '/* ' + context.id + ' */ \r\n  ';

  for (var k in context) {
    if (context.hasOwnProperty(k) && k !== 'id') {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';

  // load method should only be used by environment loader
  code = code + 'module.load = undefined;\r\n  ';

  // prevent context leakage
  'context' in context || (code = code + 'context = undefined;\r\n  ');
  
  //////////////////////////////////////////////////////////////////////////
  // TODO - BETTER ERROR HANDLING
  //////////////////////////////////////////////////////////////////////////
  code = '\r\n  try {\r\n  ' + code + '\r\n  (' + fn.toString() + 
         ').call(exports);\r\n  } catch(error) {\r\n    ' + 
                  
         '(module.error = error);' +
         //'console.log(module.error);\r\n  ' +
         
         '\r\n  } finally {\r\n    ' +
         'return module.exports;\r\n  }';
  
  // code = code + '\r\n  (' + fn.toString() + ').call(exports);\r\n  ' +
         // 'return module.exports;';

  return Function('context', code);
};

/*
 * alternate path when browser's Content Security Policy does not allow
 * 'unsafe-eval'. this path is taken when the fn argument contains params.
 *
 * executes the fn function inside an inline sandbox, passing
 * keys in context as symbols on the global namespace.  global keys are restored
 * after execution. context.module.exports is returned.
 *
 * requires:  assert, string#trim
 */
define.sandbox = function sandbox(fn, context, globals) {
  assert(typeof fn == 'function', 'define.sandbox: fn should be a function');
  assert(context && context.module, 'define.sandbox: context.module missing');
  assert(globals.define && globals.require, 'define.sandbox: globals missing');
  
  return (function () {
  
    var g = globals;
    var globalDefine = g.define;
    var globalRequire = g.require;
    
    var k;

    for (k in global) {
      g[k] = global[k];
    }
    
    var contextRequire = context.require;
    context.require = globalRequire;
    
    for (k in context) {
      if (context.hasOwnProperty(k)  && k != 'define') {
        global[k] = context[k];
      }
    }

    // load method should only be used by environment loader
    context.module.load = undefined;

    // bind global define to run against the current context monad
    function define(param) {
      return context.define(param);
    };

    // expose define util methods on the real define function in the sandbox
    define.string = g.define.string;
    define.exec = g.define.exec;
    define.sandbox = g.define.sandbox;

    // expose the fake define as global
    global.define = define;

    // populate arguments to be applied
    var args = [];
    var argNames = fn.toString().match(/function[^\)]+[\)]/)[0].split(/\)/)[0].
                      split(/\(/)[1].split(/\,/);

    for (var i = 0; i < argNames.length; ++i) {
      args[i] = context[argNames[i].trim()];
    }

    try {
      fn.apply(context.module.exports, args);
    } catch (error) {
      //////////////////////////////////////////////////////////////////////////
      // TODO - BETTER ERROR HANDLING
      //////////////////////////////////////////////////////////////////////////
      
      (module.error = error.message + '\n' + error.stack);
      //console.log(module.error);

    } finally {
      // remove pseudo-globals
      for (k in context) {
        if (k in global) {
          delete global[k];
          if (k in g) {
            global[k] = g[k];
          }
        }
      }

      // restore previously defined global.define in this context
      global.define = globalDefine;
      global.require = globalRequire;
      context.require = contextRequire;
    }
    
    return context.module.exports;
  }());
};

/*
 * utility method returns the directory name for the given filename,
 * normalizing separator character to unix (forward slash).
 */
define.dirname = function dirname(filename) {

  var w = filename.lastIndexOf('\\'); // windows
  var u = filename.lastIndexOf('/'); // unix

  return filename.substring(0, w > u ? w : u);
};

/*
 * factory method that returns a collector function for module definition data,
 * (i.e., dependency paths, aliases, and the scope function).  collector keeps
 * returning itself until the scope function argument is passed.
 */
define.monad = function monad() {

  /*
   * 6 MAY 2014 - moved monad() here so as not to create if already registered.
   * return this collector function to process parameters on successive calls.
   *
   * requires:  assert, exec, string
   */

  return function monad(param) {

    var type = typeof param;
    var value;

    assert(type.match(/string|function/), 'param must be string or function');

    value = type == 'function' && define.exec(param, monad);
    return value || (type == 'string' && define.string(param, monad));
  };
};

/*
 * executes the fn function when all dependencies are ready. returns the exports
 * value created or assigned in the fn function.
 *
 * if the fn function contains no params, then the make() strategy is followed,
 * which makes a new function from fn, passing keys in monad context as symbols.
 *
 * if the fn function contains a param name, then the sandbox() strategy is
 * followed. this strategy is intended as an alternate path to make when a
 * browser's Content Security Policy does not allow 'unsafe-eval'.
 *
 * requires:  make, sandbox
 */
define.exec = function exec(fn, monad) {

  //15 MAY 2014 ASYNC PENDING STRATEGY ADDED FOR BROWSER CASE
  if (global.document && !require('script').ready(fn, monad)) {
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

  if (fn.length > 0) {
    result = define.sandbox(fn, context, { define: define, require: require });
  } else {
    result = define.make(fn, context)(context);
  }

  stack.pop();
  !nested || (module.exports = exports);
  
  try {
    if (module.error) {
      throw new Error(module.error);
    }
  } finally {
    return result;
  }
};

/*
 * LONG METHOD
 * accepts a string id and the memoizing collector monad function, processes the 
 * requested id for alias tokens, if any, camelCases the alias, loads the import 
 * from cache, adds alias to the monad's context and returns the monad.  
 
 * checks for circular dependencies, throws an error if cycle is detected.
 *
 * requires:  camelize, Module, graph, define.cache, assert, script (if in a 
 *            document) and string#trim polyfill (if in an older browser)
 */
define.string = function string(id, monad) {

  var name = id.replace(/\\/g, '/').trim();

  var pair = name.split('{as}');
  var context = monad.context;
  var alias, globalName, filename, cycle, entry, module, exports;

  if (pair.length > 1) {

    // var alias
    alias = pair[1].trim();
    name = pair[0].trim();

    // global alias
    globalName = alias.match(/\{[^\}]+\}/);
    globalName && (alias = globalName[0].replace(/\{|\}/g, ''));

    // name alias
    alias.indexOf('/') === -1 || (alias = define.camelize(alias));

  } else {
    alias = define.camelize(name);
  }

  // handle required pathnames relative to the module, not monad file
  filename = Module._resolveFilename(name, context.module);

  // throws if cycle is detected, no matter what
  define.graph(context.module.id, filename).resolve(filename);

  // get filename's exports
  entry = define.cache[filename];
  module = entry && entry.context && entry.context.module;

  if (module && ('exports' in module)) {

    exports = module.exports;

  } else {

    // BROWSER SCRIPT ELEMENT REQUEST
    if (global.document) {

      require('script')({

        filename: filename,
        parent: context.module,
        onload: function (err, done) {
          // creates a closure on context, filename, alias, globalName, monad
          if (!err) {
            context[alias] = (globalName && global[alias]) || 
                             define.cache[filename].context.module.exports;
          }
          // monad.fn is here only if exec ran at least once before deps loaded
          if (done && monad.fn) {
            define.exec(monad.fn, monad);
          }
          //////////////////////////////////////////////////////////////////////
          //
          //  BETTER ERROR HANDLING
          //
          //////////////////////////////////////////////////////////////////////
          if (err) {
            //throw new Error(err.message);
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
