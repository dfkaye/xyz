// lib/node/monad

var assert = require('assert');
var Module = require('module');

/*---------------------------------*/

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
 * memoizing registry
 * maps id string if not mapped
 * maps dep string if not mapped
 * adds dep string to id map
 */
define.graph = function graph(id, dep) {

  graph.resolve || (graph.resolve = define.resolve);
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
define.resolve = function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    return 'cycle: ' + visited.concat(id).join(' > ');
  }

  visited[id] = visited[visited.push(id) - 1];

  var graph = define.graph;

  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
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
  
  code = '\r\n  try {\r\n  ' + code + '\r\n  (' + fn.toString() + 
         ').call(exports);\r\n  } catch(error) {\r\n    ' + 
         'console.log(error);\r\n  } finally {\r\n    ' +
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
define.sandbox = function sandbox(fn, context, stack) {
  assert(typeof fn == 'function', 'define.sandbox: fn should be a function');
  assert(context && context.module, 'define.sandbox: context.module missing');
  assert(stack && stack.length, 'define.sandbox: stack should be an array');
  
  return (function () {
  
    var index = stack.length - 1;
    var prev = index - 1;
    var g = stack[index];
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
      console.log(error.message + '\n' + error.stack);
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
 * if the fn function contains no params, then the make strategy is followed,
 * which makes a new function from fn, passing keys in monad context as symbols.
 *
 * if the fn function contains a param name, then the sandbox strategy is
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
  var index = stack.length - 1;
  var nested = index != -1 && stack[index].id === context.id;
  var exports, result;

  !nested || ((exports = module.exports) && (module.exports = {}));
  stack.push({ id: context.id, define: define, require: require });

  if (fn.length > 0) {
    result = define.sandbox(fn, context, stack);
  } else {
    result = define.make(fn, context)(context);
  }

  stack.pop();
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
 *            and string#trim polyfill if older browser
 */
define.string = function string(id, monad) {

  id = id.replace(/\\/g, '/').trim();

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
    alias.indexOf('/') === -1 || (alias = define.camelize(alias));

  } else {
    alias = define.camelize(id);
  }

  // handle required pathnames relative to the module, not monad file
  filename = Module._resolveFilename(id, context.module);

  // cycles are forbidden, no matter what
  if (cycle = define.graph(context.module.id, filename).resolve(filename) ) {
    assert(!cycle, cycle);
  }

  // get filename's exports
  entry = define.cache[filename];
  module = entry && entry.context && entry.context.module; // hmmm

  if (module && ('exports' in module)) {

    exports = module.exports;

  } else {

    ////////////////////////////////////////////////////////////////////////////
    //
    // TODO: externalize to a shorter block
    //
    ////////////////////////////////////////////////////////////////////////////

    // BROWSER SCRIPT ELEMENT REQUEST
    if (global.document) {

      require('script')({

        filename: filename,
        parent: context.module,
        onload: function (err, done) {

          /*
           * creates a closure on context, filename, alias, globalName, monad
           */

          if (!err) {

            var exports = define.cache[filename].context.module.exports;

            context[alias] = (globalName && global[alias]) || exports;
          }

          //////////////////////////////////////////////////////////////////////
          //
          // TODO: better error handler
          //
          //////////////////////////////////////////////////////////////////////

          // monad.fn is here only if exec ran once before deps loaded
          if (done && monad.fn) {
            define.exec(monad.fn, monad);
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
