// sandbox
require('should');

var assert = require('assert');

module.exports = sandbox;

function sandbox(fn, context) {

  var g = {};
  var k;
  
  for (k in global) {
    g[k] = global[k];
  }
  
  for (k in context) {
    if (context.hasOwnProperty(k)) {
      global[k] = context[k];
    }
  }
    
  fn.call(global.module.exports);

  var exports = global.module.exports;
  
  for (k in context) {
    if (k in global && context.hasOwnProperty(k)) {
      delete global[k];
      if (k in g) {
        global[k] = g[k];
      }
    }
  }
  
  return exports;
}


/* TESTS START HERE */

suite('sandbox');

test('exists', function () {
  should.should.be.ok
  sandbox.should.be.Function
});

test('should assign and remove context on global', function () {

  // do this or else we get the real module for this test suite
  var module = { exports: {} };
  var context = { module: module };
  
  function fn() {
    ('module' in global).should.be.true;
  };
  
  ('module' in global).should.be.false;

  sandbox(fn, context);
    
  ('module' in global).should.be.false;
});

test('should have access to outer scope', function () {

  // do this or else we get the real module for this test suite
  var module = { exports: {} };
  var context = { module: module };
  var outer = 'outer';
  
  function fn() {
    outer.should.be.equal('outer');
  };
  
  sandbox(fn, context);
});

test('should return module.exports', function () {
  
  // do this or else we get the real module for this test suite
  var module = { exports: {} };
  var context = { module: module };
  
  function fn() {
    module.exports = 'exported';
  };
  
  var exported = sandbox(fn, context);
  
  exported.should.be.equal('exported');
});

test('should return nested module.exports', function () {
  
  // do this or else we get the real module for this test suite
  var module = { exports: {} };
  var context = { module: module };
  
  function fn() {
    module.exports = 'outer';
    
    function fn() {
      module.exports = 'inner'
    }
    
    module.exports = sandbox(fn, context);
  };
  
  var exported = sandbox(fn, context);
  
  exported.should.be.equal('inner');
});

test('this, exports, module.exports ~ needs work', function () {
  
  // do this or else we get the real module for this test suite
  var exports = {};
  var module = { exports: exports };
  var context = { module: module };
  
  function fn() {
    module.exports.should.be.equal(this);
    module.exports.should.be.equal(exports);

  };
  
  sandbox(fn, context);
  
});