// suites/camelize

require('should');

require('../../../lib/node/monad');

var camelize = define.camelize;

/* TESTS START HERE */

suite('camelize');

test('exists', function () {
  should.should.be.ok
  camelize.should.be.Function
});

test('path/to/file', function () {
  camelize('path/to/file').should.be.equal('file');
});

test('path/to/some-module', function () {
  camelize('path/to/some-module').should.be.equal('someModule');
});

test('path/to/some-other-module', function () {
  camelize('path/to/some-other-module').should.be.equal('someOtherModule');
});

test('path/to/dot.name.ext', function () {
  camelize('path/to/dot.name.ext').should.be.equal('dotName');
});

test('path/to/ WHITE SPACE ', function () {
  camelize('path/to/ WHITE SPACE ').should.be.equal('WHITESPACE');
});

test('replace windows backslash with *nix forslash', function () {
  camelize(__filename).should.be.equal('camelize');
});


suite('does not camelize');

test('path/to/under_score', function () {
  camelize('path/to/under_score').should.be.equal('under_score');
});

test('path/to/this', function () {
  camelize('path/to/this').should.be.equal('this');
});

test('path/to/undefined', function () {
  camelize('path/to/undefined').should.be.equal('undefined');
});

test('path/to/null', function () {
  camelize('path/to/null').should.be.equal('null');
});

test('path/to/""', function () {
  camelize('path/to/""').should.be.equal('""');
});

test('path/to/0', function () {
  camelize('path/to/0').should.be.equal('0');
});

test('path/to/""', function () {
  camelize('path/to/-1').should.be.equal('-1');
});

test('path/to/true', function () {
  camelize('path/to/true').should.be.equal('true');
});

test('path/to/false', function () {
  camelize('path/to/false').should.be.equal('false');
});
