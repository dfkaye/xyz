// suites/camelize

require('../../../lib/node/monad');

var camelize = define.camelize;
var assert = require('assert');

/* TESTS START HERE */

suite('camelize');

test('exists', function () {
  assert(typeof camelize == 'function');
});

test('path/to/file', function () {
  assert(camelize('path/to/file') === 'file');
});

test('path/to/some-file', function () {
  assert(camelize('path/to/some-module') === 'someModule');
});

test('path/to/some-other-module', function () {
  assert(camelize('path/to/some-other-module') === 'someOtherModule');
});

test('path/to/dot.name.ext', function () {
  assert(camelize('path/to/dot.name.ext') === 'dotName');
});

test('path/to/ WHITE SPACE ', function () {
  assert(camelize('path/to/ WHITE SPACE ') === 'WHITESPACE');
});

test('replace windows backslash with *nix forslash', function () {
  assert(camelize(__filename) === 'camelize');
});


suite('does not camelize');

test('path/to/under_score', function () {
  assert(camelize('path/to/under_score') === 'under_score');
});

test('path/to/this', function () {
  assert(camelize('path/to/this') === 'this');
});

test('path/to/undefined', function () {
  assert(camelize('path/to/undefined') === 'undefined');
});

test('path/to/null', function () {
  assert(camelize('path/to/null') === 'null');
});

test('path/to/""', function () {
  assert(camelize('path/to/""') === '""');
});

test('path/to/0', function () {
  assert(camelize('path/to/0') === '0');
});

test('path/to/""', function () {
  assert(camelize('path/to/-1') === '-1');
});

test('path/to/true', function () {
  assert(camelize('path/to/true') === 'true');
});

test('path/to/false', function () {
  assert(camelize('path/to/false') === 'false');
});
