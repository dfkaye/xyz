// should learning test

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
  suite('nested suite');
  test('inside nested suite', function () {
    test.should.be.Function;
  });
});

test('delete and re-require should', function() {

  require.cache['should'].should.be.ok;
  module.constructor._cache['should'].should.be.ok;
  
  delete require.cache['should'];
  (typeof require.cache['should']).should.be.Null;
  
  should.should.be.ok;

  // don't do this - it breaks all existing objects and tests with should
  // which defines with ES5 Object.defineProperty
  //delete Object.prototype.should;

  // instead nullify should.should, then verify that require restores it
  should.should = undefined;

  require('should');
  should.should.be.ok;
});