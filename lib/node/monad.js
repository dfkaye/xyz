// lib/node/define
// newer more monadic version
// 20-22 APRIL 2014

var camelize = require('./camelize');
var exec = require('./exec');

/* ---------------- */

//var assert = require('assert');
function assert(ok, message) {
  ok || (function (msg) {
    throw new Error(msg);
  }(message));
}

/* ---------------- */

var Module = module.constructor; // <= stay out of other processes
var parent = module.parent; // everything loads relative to the calling module

function Namespace(filename) {
  this.id = filename;
  this.module = resolve(filename); // load real module
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

/* ---------------- */

var registry = {};

module.exports = global.define = define;

function define(param) {
  assert((typeof param).match(/string|function/),
         'param must be string or function');
  return define.id(__filename)(param);
}

define.id = function (id) {
  function monad(param) {
    var self = monad.namespace;
    var type = typeof param;
    // handle invalid type? then...
    var value = type == 'function' && exec(param, self);
    return value || (type == 'string' && string(param, monad));
  }
  // resolve id filename (); then registry, attach and away...
  monad.namespace = registry[id] || (registry[id] = new Namespace(id));
  //monad.namespace = registry[id];
  return monad;
}

function string(path, monad) {
  // parse, load, and away...
  // trim path string...
  // path = path.replace(/^\s+|\s+$/gm, '');
  path = path.trim();
  var self = monad.namespace;
  var pair = path.split(':=');
  var alias, globalName;
  if (pair.length > 1) {
    // var alias
    alias = pair[0].trim();
    path = pair[1].trim();
    // global alias
    globalName = alias.match(/\{[^\}]+\}/);
    globalName && (alias = globalName[0].replace(/\{|\}/g, ''));
    // path alias
    alias.indexOf('/') === -1 || (alias = camelize(alias));
  } else {
    alias = camelize(path);
  }
  // using real module require
  self[alias] = self.module.require(path);
  if (globalName) {
    self[alias] = global[alias];
  }
  return monad;
}
