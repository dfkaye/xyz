// './module.js'
if (!global.document) {
  module.exports = require('module');
} else {

  //////////////////////////////////////////////////////
  // normalize
  // Module._load('normalize');
  // Module._cache['normalize'].exports = normalize;
  ;(function() {
  
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
    
    global.Module = Module;
    
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
  }());
}


