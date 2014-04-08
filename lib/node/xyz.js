
// camelize

var path = require('path');

var RE_SEP = /\-|\./;
var RE_SEP_AZ = /(\-|\.)[a-z]/;
var RE_SEP_AZ_G = /(\-|\.)[a-z]/g;
var RE_WS = /[\s]+/g;
var BLANK = '';
 
function camelize(name) {

  var id, match, ch, i,
      ext = BLANK;
    
  if (name.indexOf('.') > 0) {
    ext = name.substring(name.lastIndexOf('.'), name.length);
  }
  
  // using node.js path object's sep character here
  id = name.split('/').slice(-1)[0];
  id = id.substring(0, id.lastIndexOf(ext));
    
  if (match = id.match(RE_SEP_AZ_G)) {
    for (i = 0; i < match.length; i++) {
      ch = match[i].replace(RE_SEP, BLANK).toUpperCase();
      id = id.replace(RE_SEP_AZ, ch);
    }
  }
  
  return (id.substring(0, id.lastIndexOf('.')) || id).replace(RE_WS, BLANK);
}

// xyz

var assert = require('assert');
var Module = require('module');

var registry = {};
var originalPrototypeRequire = Module.prototype.require;
var originalRequire = require;

Module.prototype.monadic = function () {
  Module.prototype.require = require_monad;
};

Module.prototype.default = function () {
  Module.prototype.require = originalPrototypeRequire;
};

// idea borrowed from 
// https://github.com/fluidsonic/poison/blob/master/lib/poison.js

function require_monad(param) {

  var self = this;
  var id = this.id;
  var type = typeof param;
  var name, alias;
  var temp;
  var filename;
  var child;
  var childId;
  var cache;
  
  registry[id] || (registry[id] = { module: this, require: originalRequire });
  
  if (type == 'function') {
    temp = exec.call(registry[id].module.exports, registry[id], param);
    delete registry[id]; // reclaim key for next use
    return temp || this.exports;
  }
  
  // get var_alias from {x}:path
  // get path_alias from {a/b}:path
  // import x as y
  
  assert(typeof param == 'string', 'param must be a string');
  assert(param, 'missing param');
   
  filename = Module._resolveFilename(param, this);
  cache = Module._cache[filename];
  child = (cache && cache.exports) || Module._load(filename, this);  
  
  childId = camelize(param);
  registry[id][childId] = child;
  
  //console.log('saved ' + filename + 'to ' + id + ' in ' + this.parent.id)
  //console.log(require.cache[filename]);// === Module._cache[filename].id);

  // here's the monadic part
  // have to override this or context is set on parent rather than this
  function requireMonad(p) {
    return self.require(p);
  }
  
  return requireMonad;
};

/*
 * puts context entries into scope of function fn, 
 * calls new Function, 
 * returns context
 */
function exec(context, fn) {

  var code = '  "use strict";\r\n  ';
  var  k, f;
  
  for (var k in context) {
    if (context.hasOwnProperty(k)) {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';

  // prevent context leakage
  'context' in context || (code = code + 'var context = undefined;\r\n  ');
  'exec' in context || (code = code + 'var exec = undefined;\r\n');  
  code = code + '\n;(' + fn.toString() + ').call(exports)' + ';\r\n  ';

  (Function('context', code))(context);
  //console.log((Function('context', code)).toString());
  
  return context;
};