/*
 * browser-side polyfill for assert, Module, require, and a script loader for
 * asynchronous requests.  'assert', 'module' and 'script' are registered into
 * the module system polyfill at bottom of this file.
 */
global = (typeof global != 'undefined' && global) || window;

!global.document || (function () {

  function assert(ok, message) {
    ok || (function (msg) {
      throw new Error(msg);
    }(message));
  }

  assert(global, 'global not defined');

  //////////////////////////////////////////////////////////////////////////////
  //
  //  TODO - better var management of scripts, main, parentNode,
  //         __filename, __dirname, __BASEPATH
  //
  //////////////////////////////////////////////////////////////////////////////

  // find self
  var scripts = document.scripts || document.getElementsByTagName('script');
  var main = scripts[scripts.length - 1];
  var href = document.location.href;

  assert(main.getAttribute('data-monad') !== void 0, 'missing main data-attr');

  global.__filename = main.src;
  global.__dirname = __filename.substring(0, __filename.lastIndexOf('/'));
  global.BASEPATH = href.substring(0, href.lastIndexOf('/') + 1);

  //////////////////////////////////////////////////////////////////////////////
  //
  //  TODO - better var management of normalize() string constants
  //
  //////////////////////////////////////////////////////////////////////////////

  var BLANK = '';
  var SLASH = '/';
  var DOT = '.';
  var DOTS = DOT.concat(DOT);
  var PREFIX = document.location.protocol + '//' + document.location.host;

  function normalize(path) {

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

      if (token == DOTS) {
        target.pop();
      } else if (token != BLANK && token != DOT) {
        target.push(token);
      }
    }

    return PREFIX + SLASH + target.join(SLASH).replace(/[\/]{2,}/g, SLASH);
  }

  //////////////////////////////////////////////////////

  /*
   * VERY REDUCED VERSION of node.js Module api and require() binding
   *
   * https://github.com/joyent/node/blob/f1dc55d7018e2669550a8be2c5b6c091da616483/lib/module.js
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
    
    if (request.length && request.indexOf('/') === -1 && request.indexOf('.') === -1) {
    
      // builtin or 'node_module' type
      return request;
    } 
    
    if (request.indexOf(document.location.protocol) === 0) {
    
      // absolute path needs no parent resolution
      str = normalize(request);
      
    } else {

      // href as dirname corrects relative ../../../pathnames
      parentId = (!!parent ? parent.id : document.location.href + '/');
      sepIndex = parentId.lastIndexOf('/');

      if (sepIndex != -1) {
        parentId = parentId.substring(0, sepIndex + 1);
      }
      
      (request && request.length > 0) || (request = '/');
      str = normalize(parentId + request);
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

  // string#trim polyfill
  typeof String.prototype.trim == 'function' ||
  (String.prototype.trim = function trim() {
    return this.replace(/^\s+|\s+$/gm, '');
  });

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

    ////////////////////////////////////////////////////////////////////////////
    //
    // TODO: better declaration and handle for main and parentNode
    //
    ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  //
  // TODO: better pre-registering modularize pattern
  //
  ////////////////////////////////////////////////////////////////////////////

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
  Module._cache[pathID].exports = { normalize: normalize };
  
  // publish script
  var scriptID = Module._resolveFilename('script');
  Module._load(scriptID);
  Module._cache[scriptID].exports = script;

}());

//////////////////////////////////////////////////////