// should-learning-test

////////////////////////////////////////////////////////////////////////////////
//
// LEARNING TESTS ABOUT MOCHA TDD INTERFACE
//
////////////////////////////////////////////////////////////////////////////////

suite('learning about should');

before(function() {
  this.all = 'before-all'
});

after(function() {
  this.all = 'after-all'
});

beforeEach(function() {
  require('should');
  this.something = 'before-each';
});

afterEach(function() {
  this.something = undefined;
  delete require.cache['should'];
  should = undefined;
});

test('should is global', function () {
  should.should.be.ok;
});

test('before each', function() {
  this.something.should.be.equal('before-each');
  this.something = 'hello';
  this.something.should.be.equal('hello');
});

test('nested suite', function () {
  suite('heart');
  test('inside', function () {
    test.should.be.Function;
  });
});

test('delete and re-require should', function() {

  require.cache['should'].should.be.ok;
  module.constructor._cache['should'].should.be.ok;
  
  delete require.cache['should'];
  (typeof require.cache['should']).should.be.Null;
  
  should.should.be.ok;
  should = undefined;

  // don't do this - it breaks all existing objects with should
  //delete Object.prototype.should;

  require('should');
  should.should.be.ok;
});