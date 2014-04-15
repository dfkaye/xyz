// context.js

// placeholder for the context constructor
// context(module, name, etc.)
var camelize = require('./camelize');
var exec = require('./exec');
var assert = require('assert');

var Module = module.constructor;

//
var context = new Context

function Context(id, module) {
  // this.module = module;
  // this.filename = id || module.filename;
  // this.__filename = module.filename;
  // this.__dirname = module.dirname;
}

Context.prototype.id = function id(id) {
  // this.id = this.filename = id;
};

Context.prototype.define = function define(param) {

};

Context.prototype.exec = function exec(param) {
  // var result = exec()
  // context = new Context;
  // return result;
};

Context.prototype.load = function load(param) {

};

Context.prototype.require = function require(param) {
  // return this.module.require(param);
}

Context.prototype.require.cache = Module._cache;
