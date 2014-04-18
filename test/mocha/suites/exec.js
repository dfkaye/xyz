// suites/camelize

require('should');
var exec = require('../../../lib/node/exec');


/* TESTS START HERE */

suite('exec');

test('exists', function () {
  should.should.be.ok
  exec.should.be.Function
});

test('should not leak internal var refs', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    (typeof fn).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
    (typeof exec).should.be.equal('undefined');
  };
  
  exec(context, fn);
});

test('module.exports should be exports', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () { 
    module.exports.should.be.equal(exports);
  };

  exec(context, fn);
});

test('exports should be this', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    exports.should.be.equal(this);
  };

  exec(context, fn);
});

test('returns module.exports', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    module.exports = 'good morning';
  };

  var r = exec(context, fn);
  
  r.should.be.equal('good morning');
});

test('does not "return" a return value', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () { 
    return 'hello';
  };
  
  var h = exec(context, fn);
  
  h.should.not.be.equal('hello');
});


suite('exec.fn');

test('returns a new function', function () {

  var context = { module: { exports: {} } };
  
  var fn = function () {
    return 'hello';
  };
  
  var f = exec.fn(context, fn);
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
  
  var f = exec.fn(context, fn);
  
  f.toString().should.containEql('/* this/is/my/file-name */');
});


suite('exec.error');

test('context missing should throw', function () {

  (function () {
    exec();
  }).should.throw('context is not defined');
});

test('module missing should throw', function () {

  var context = {};
  var fn = function () {};
  
  (function () {
    exec(context, fn);
  }).should.throw('module is not defined');
});

test('exports missing should throw', function () {

  var context = { module: {} };
  var fn = function () {};
  
  (function () {  
    exec(context, fn);
  }).should.throw('module.exports is not defined');
});

test('function missing should throw', function () {

  var context = { module: { exports: {} } };

  (function () {
    exec(context);
  }).should.throw('fn is not defined');
});
