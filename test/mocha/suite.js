// mocha/suite.js


require('../../lib/node/xyz');
require('should');

module.monadic();

////////////////////////////////////////////////////////////////////////////////
//
// LEARNING TESTS ABOUT MOCHA TDD INTERFACE
//
////////////////////////////////////////////////////////////////////////////////


suite('xyz');

before(function() {
  this.all = 'before-all'
});

after(function() {
  this.all = 'after-all'
});

beforeEach(function() {
  this.something = 'default';
});

afterEach(function() {
  this.something = undefined;
});

test('before each', function() {
  this.something.should.be.equal('default');
  this.something = 'hello';
  this.something.should.be.equal('hello');
});

test('nested suite', function () {
  suite('heart');
  test('inside', function () {
    test.should.be.Function;
    //throw new Error();
  });
});

////////////////////////////////////////////////////////////////////////////////
//
// REAL TESTS START HERE
//
////////////////////////////////////////////////////////////////////////////////

test('require should - not good', function() {

  should.should.be.ok;
  require.cache['should'].should.be.ok;
  module.constructor._cache['should'].should.be.ok;
  delete require.cache['should'];
  (typeof require.cache['should']).should.be.Null;
  
  should.should.be.ok;
  should = undefined;

  //delete Object.prototype.should;

  //module.default();

  //console.log(require.toString());
  //console.log(module.require.toString());

  require('should');

  //module.monadic();
  
  //console.log(require.toString());
  //console.log(module.require.toString());
  
  (require)
  ('fs')
  (function() {
    should.should.be.ok;
    fs.should.be.ok;
  });
  
});

test('fake module', function() {

  (require)
  ('./fake')
  ('should')
  ('fs')  
  (function () {
  
    // INNER NESTED SCOPE
    (require)
    ('fs')
    (function () {
      (typeof fs).should.not.be.equal('undefined');
      (typeof fake).should.be.equal('undefined');
    });
    
    // INNER SCOPE
    fake('id').should.be.equal('id');
    fs.should.be.ok;
    (typeof require).should.be.equal('function');
    
    (typeof fn).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
    (typeof exec).should.be.equal('undefined');
    module.exports.should.be.equal(exports);
    this.should.be.equal(exports);
  });
  
  // OUTSIDE SCOPE
  (typeof fs).should.be.equal('undefined');
  (typeof fake).should.be.equal('undefined');
  
});

test('hyphenated-test-module', function() {
  (require)
  ('fs')  
  ('./hyphenated-test-module')
  (function () {
    fs.should.be.ok;
    hyphenatedTestModule().should.be.equal('hyphenated');
  });
});

test('no deps, no leaks', function() {
  (require)
  (function () {  
    (typeof fs).should.be.equal('undefined');
    module.filename.should.containEql('suite.js');
  });
});

test('require.cache', function () {  
  (require)
  ('./fake')
  (function () {
  
    var m = module.constructor._cache;
    var r = require.cache;
    var filename = module.constructor._resolveFilename('./fake', module);
    
    (!!r && !!m && (m === r)).should.be.true;
    (m[filename].exports === fake).should.be.true;
    (r[filename].exports === fake).should.be.true;
    
    delete r[filename];
    
    (r[filename] === undefined).should.be.true;
    (m[filename] === undefined).should.be.true;
  });
});

test('use strict', function () {
  (require)
  ('./fake')
  (function () {
    'use strict';
    fake.should.be.ok;
  });
});

test('returns module.exports', function () {
  var exported = (require)
                  (function () {
                    'use strict';
                    module.exports = {};
                  });
  
  exported.should.be.ok;
});

test('return an import', function () {
  
  (f === undefined).should.be.true;
  
  var f = (require)
          ('./fake')
          (function () {
            'use strict';
            fake.should.be.ok;
            return fake;
          });
  
  f.should.be.ok;
  
  // didn't leak?
  (typeof fake).should.be.equal('undefined');
  
});