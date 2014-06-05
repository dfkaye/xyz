// suites/make

require('../../../lib/node/monad');

var make = define.make;
var assert = require('assert');

/* TESTS START HERE */

suite('make');

test('returns a new function', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    return 'hello';
  };
  
  var f = make(fn, context);

  assert(typeof f == 'function', 'make should return a function');
  
  var s = f.toString();
  
  var tokens = ['use strict', ').call(exports)', 'return module.exports'];
  
  for (var i = 0; i < tokens.length; ++i ) {
    assert(s.indexOf(tokens[i]) > -1, 'made fn missing token: ' + tokens[i]);
  }
  
  assert(s.indexOf('return \'hello\';') > -1, 'made fn missing return statement');
  
});

test('prints context.id', function () {

  var context = { 
                  id: 'this/is/my/file-name', 
                  module: { exports: {} } 
                };
  
  var fn = function () {
    return 'hello';
  };
  
  var f = make(fn, context);
  
  assert(f.toString().indexOf('/* this/is/my/file-name */') > -1, 
         'should print file name');
});


suite('make errors');

test('no args should throw', function () {

  assert.throws(function () {
    make();
  }, 'make: requires fn and context arguments.');
});

test('context missing should throw', function () {

  var fn = function () {};
  
  assert.throws(function () {
    make(fn);
  }, 'make: requires fn and context arguments.');
});

test('module missing should throw', function () {

  var context = {};
  var fn = function () {};
  
  assert.throws(function () {
    make(fn, context);
  }, 'make: module is not defined.');
});

test('exports missing should throw', function () {

  var context = { module: {} };
  var fn = function () {};
  
  assert.throws(function () {  
    make(fn, context);
  }, 'make: module.exports is not defined.');
});

test('bad function arg type should throw', function () {

  var fn = {};
  var context = { module: { exports: {} } };

  assert.throws(function () {
    make(fn, context);
  }, 'make: fn should be a function.');
});


suite('make and exec');

// fixture - call make and execute it
function exec(fn, context) {

  make(fn, context)(context);

  return context.module.exports;
}

test('should not leak internal var refs', function () {

  var context = { module: { exports: {} }, assert: assert };
  
  var fn = function () {
    assert(typeof fn === 'undefined');
    assert(typeof context === 'undefined');
    assert(typeof exec === 'undefined');
  };
  
  exec(fn, context);
});

test('module.exports should be exports', function () {

  var context = { module: { exports: {} }, assert: assert };
  
  var fn = function () { 
    assert(module.exports === exports);
  };

  exec(fn, context);
});

test('exports should be this', function () {

  var context = { module: { exports: {} }, assert: assert };
  
  var fn = function () {
    assert(exports === this);
  };

  exec(fn, context);
});

test('returns module.exports', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    module.exports = 'good morning';
  };

  var r = exec(fn, context);
  
  assert(r === 'good morning');
});

test('does not return a "return value"', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () { 
    return 'hello';
  };
  
  var h = exec(fn, context);
  
  assert(h !== 'hello');
});

test('module.load() should be undefined', function () {

  var context = { module: { exports: {}, load: function () {} } };
  
  var fn = function () {
    module.exports = typeof module.load;
  };
  
  var t = exec(fn, context);
  
  assert(t === 'undefined');
});
