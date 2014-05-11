// suites/make

var make = require('../../../lib/node/make');
require('should');


/* TESTS START HERE */

suite('make');

test('returns a new function', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    return 'hello';
  };
  
  var f = make(fn, context);
  f.should.be.Function;
  
  var s = f.toString();
  s.should.containEql('use strict');
  s.should.containEql(').call(exports);\r\n  return module.exports;');
  s.should.containEql('return \'hello\';');
});

test('prints context.filename', function () {

  var context = { 
                  filename: 'this/is/my/file-name', 
                  module: { exports: {} } 
                };
  
  var fn = function () {
    return 'hello';
  };
  
  var f = make(fn, context);
  
  f.toString().should.containEql('/* this/is/my/file-name */');
});


suite('make errors');

test('no args should throw', function () {
  (function () {
    make();
  }).should.throw('make: requires fn and context arguments.');
});

test('context missing should throw', function () {
  var fn = function () {};
  (function () {
    make(fn);
  }).should.throw('make: requires fn and context arguments.');
});

test('module missing should throw', function () {

  var context = {};
  var fn = function () {};
  
  (function () {
    make(fn, context);
  }).should.throw('make: module is not defined.');
});

test('exports missing should throw', function () {

  var context = { module: {} };
  var fn = function () {};
  
  (function () {  
    make(fn, context);
  }).should.throw('make: module.exports is not defined.');
});

test('bad function arg type should throw', function () {
  var fn = {};
  var context = { module: { exports: {} } };

  (function () {
    make(fn, context);
  }).should.throw('make: fn should be a function.');
});


suite('make and exec');

// fixture - call make and execute it
function exec(fn, context) {

  make(fn, context)(context);

  return context.module.exports;
}

test('should not leak internal var refs', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    (typeof fn).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
    (typeof exec).should.be.equal('undefined');
  };
  
  exec(fn, context);
});

test('module.exports should be exports', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () { 
    module.exports.should.be.equal(exports);
  };

  exec(fn, context);
});

test('exports should be this', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    exports.should.be.equal(this);
  };

  exec(fn, context);
});

test('returns module.exports', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    module.exports = 'good morning';
  };

  var r = exec(fn, context);
  
  r.should.be.equal('good morning');
});

test('does not return a "return value"', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () { 
    return 'hello';
  };
  
  var h = exec(fn, context);
  
  h.should.not.be.equal('hello');
});

test('module.load() should be undefined', function () {

  var context = { module: { exports: {}, load: function () {} } };
  
  var fn = function () {
    module.exports = typeof module.load;
  };
  
  var t = exec(fn, context);
  
  t.should.be.equal('undefined');
});
