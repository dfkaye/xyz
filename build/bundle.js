// monad.js for the browser
// will be replaced by build/concat
// currently in place for testing

global = (typeof global != 'undefined' && global) || window;

!global.document || (function () {

  /*
   * browser-side polyfill for assert, Module, require, and a script loader for
   * asynchronous requests
   */
  function assert(ok, message) {
    ok || (function (msg) {
      throw new Error(msg);
    }(message));
  }

  assert(global, 'global not defined');

  // find self
  var scripts = document.scripts || document.getElementsByTagName('script');
  var main = scripts[scripts.length - 1];

  assert(main.getAttribute('data-monad') !== void 0, 'missing main data-attr');

  global.__filename = main.src;
  global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));
  global.BASEPATH = document.location.href.substring(0, document.location.href.lastIndexOf('/') + 1);

  //////////////////////////////////////////////////////

  var BLANK = '';
  var SLASH = '/';
  var DOT = '.';
  var DOTS = DOT.concat(DOT);
  var PREFIX = document.location.protocol + '//' + document.location.host;

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
   * requires:  assert, normalize, PREFIX, document.location.href
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
    var module = Module._cache[id] || (Module._cache[id] = new Module(id, parent));
                  
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

    if (request.indexOf(PREFIX) == 0) {
      // absolute path needs no parent resolution
      return normalize(request);
    }
    
    // href as dirname corrects relative ../../../pathnames
    var parentId = (!!parent ? parent.id : document.location.href + '/');
    var sepIndex = parentId.lastIndexOf('/');
    
    if (sepIndex != -1) {
      parentId = parentId.substring(0, sepIndex + 1);
    }
      
    return normalize(parentId + request);
  };

  /*
   * GLOBAL REQUIRE
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

    
  // initialize assert
  var assertID = Module._resolveFilename('assert');
  Module._load(assertID);
  Module._cache[assertID].exports = assert;
  
  // initialize Module
  var moduleID = Module._resolveFilename('module');
  Module._load(moduleID);
  Module._cache[moduleID].exports = Module;
  
  // initialize script
  var scriptID = Module._resolveFilename('script');
  Module._load(scriptID);
  Module._cache[scriptID].exports = script;

}());

//////////////////////////////////////////////////////
// lib/node/monad
// 20-22 APRIL 2014 ! monadic version ! replaces lib/node/define spritzer
// 1 MAY 2014 ! graph !
// 5 MAY 2014 ! get rid of parent references !
// 6 MAY 2104 ! collapse namespace into monad !
// 8 MAY 2104 ! make exec local, make make() its own module !
// 9 MAY 2104 ! remove define.id, just use define(id) !

//////////////////////////////////////////////////////

var assert = require('assert');
var Module = require('module');

/*---------------------------------*/

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

namespace.camelize = function camelize(name) {

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
 * memoizing registry
 * maps id string if not mapped
 * maps dep string if not mapped
 * adds dep string to id map
 */
namespace.graph = function graph(id, dep) {

  graph.items || (graph.items = {});
  
  var item;
  
  !id || (item = graph.items[id] || (graph.items[id] = []));
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));
    
  return graph;
};

/*
 * recursively visits id string map items, depth first.
 * returns message string if a cycle is detected
 */
namespace.graph.resolve = function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    return 'cycle: ' + visited.concat(id).join(' > ');
  }
  
  visited[id] = visited[visited.push(id) - 1];

  for (var i = 0, deps = namespace.graph.items[id], msg; deps && i < deps.length; ++i) {
    msg = resolve(deps[i], visited);
    if (msg) {
      return msg;
    }
  }
};

/*
 * make a new Function converting context properties to local varnames, and 
 * embed the given fn as an IIFE bound to context.module.exports.
 */
namespace.make = function make(fn, context) {
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
    
      require('script').request({
      
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
           
          // monad.fn is here only if exec ran once before deps loaded
          if (done && monad.fn) {
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

//////////////////////////////////////////////////////

// pre-loading essentially, relying on hoisting
global.define = namespace.define;
global.define.namespace = namespace;
