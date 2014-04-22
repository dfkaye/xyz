// lib/node/define
// newer more monadic version
// 20-22 APRIL 2014
var camelize = require('./camelize');

var Module = module.constructor; // <= stay out of other processes
var parent = module.parent; // everything loads relative to the calling module

var registry = {};

module.exports = global.define = define;

function define(param) {

  assert((typeof param).match(/string|function/),
         'param must be string or function');

  return define.assert(__filename)(param);
}

define.assert = function (id) {

  function monad(param) {

    var self = monad.namespace;
    var type = typeof param;

    // handle invalid type? then...
    var value = type == 'function' && exec(param, self);
    return value || (type == 'string' && string(param, monad));
  }

  // resolve id filename (); then registry, attach and away...
  registry[id] || (registry[id] = new namespace(id));
  monad.namespace = registry[id];
  return monad;
}

function namespace(filename) {
  this.id = filename;
  this.module = resolve(filename); // real module
  this.__filename = filename;
  this.__dirname = dirname(filename);
  this.require = parentRequire;
}

function parentRequire(path) {
  return parent.require(path);
}

parentRequire.cache = Module._cache;


function resolve(path) {

  var filename = Module._resolveFilename(path, parent);
  var m = Module._cache[filename];

  if (!m) {
    Module._load(filename);
  }

  return Module._cache[filename];
}

function dirname(filename) {

  var w = filename.lastIndexOf('\\');
  var u = filename.lastIndexOf('/');

  return filename.substring(0, w > u ? w : u);
}

function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

function string(path, monad) {

  // parse, load, and away...

  var self = monad.namespace;
  var pair = path.split(':=');
  var alias;

  if (pair.length > 1) {

    // var alias
    alias = pair[0];
    path = pair[1];

    // path alias
    alias.indexOf('/') === -1 || (alias = camelize(alias));

  } else {
    alias = camelize(path);
  }

  // using real module require
  self[alias] = self.module.require(path);  

  return monad;
}

function exec(fn, namespace) {

  assert(namespace.module, 'module is not defined');

  make(fn, namespace)(namespace); // or f = make(fn, namespace); f(namespace);
  return namespace.module.exports;
}

function make(fn, context) {

  assert(context && typeof context == 'object', 'context is not defined');
  assert(context.module && typeof context.module == 'object', 
         'module is not defined');
  assert('exports' in context.module, 'module.exports is not defined');
  assert(fn && typeof fn == 'function', 'fn is not defined');

  var code = '  "use strict";\r\n  ';
  var k, f;

  code = code + '/* ' + context.filename + ' */ \r\n  ';

  for (var k in context) {
    if (context.hasOwnProperty(k) && k !== 'id') {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';

  // prevent context leakage
  'context' in context || (code = code + 'context = undefined;\r\n  ');

  code = code + '\r\n  (' + fn.toString() + ').call(exports);\r\n  ' +
         'return module.exports;';

  return Function('context', code);
}