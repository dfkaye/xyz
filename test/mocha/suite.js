// mocha/suite.js

require('should');

//console.dir(global);

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

test('hello', function() {
  this.something.should.be.equal('default');
  this.something = 'hello';
  this.something.should.be.equal('hello');
});

test('default', function() {
  this.something.should.be.equal('default');
});

test('require', function() {
  //require.should.be.equal(module)
  console.log(module.require.toString());
});

