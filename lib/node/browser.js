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

    if (request.indexOf(document.location.host) > 0) {
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