// mocha/suites/browser
suite('browser globals');

test('assert', function () {
  assert('assert');
});

test('global', function () {
  assert(global === window);
});

test('__filename', function () {
  assert(__filename === 'http://localhost:7357/lib/browser/monad.js');
});

test('__dirname', function () {
  assert(__dirname === 'http://localhost:7357/lib/browser');
});


suite('normalize');

test('BASEPATH', function () {
  assert(BASEPATH === 'http://localhost:7357/test/mocha/');
});

test('_resolveFilename', function () {
  var id = 'fake/path';
  Module._resolveFilename(id, { id: __filename }).should.be.equal(__dirname + '/' + id + '.js');
});


suite('define');

test('define', function () {
  assert(typeof define === 'function');
});

test('(define)(__filename)', function () {
  (define)(__filename).should.be.Function;
});

test("(define)(__filename)('./fake/path')", function () {
  (define)(__filename)('./fake/path').should.be.Function;
});

test("(define)(__filename)('./fake/path')(function() {});", function () {
  (define)(__filename)('./fake/path')(function() {}).should.be.ok;
});

test("exec", function () {
  var exported = (define)(__filename)
  (function() {
    module.exports = "OK";
  });
  
  exported.should.be.equal("OK");
});

test("exec __dirname is localized", function () {
  (define)('./fake/path')
  (function () {
    // remember, this __dirname is local to this module !!!
    module.id.should.be.equal(__dirname + '/path' + '.js');
    module.exports = 'fakery';
  });

  (define)(__filename)
  ('./fake/path')
  (function() {
    console.log(path);
    //(typeof path).should.be.false
  });
});



suite.only('script load cache');

test('loadcache', function () {
  var cache = loadcache();
  var scripts = document.scripts || document.getElementsByTagName('script');
  assert(cache.length === scripts.length);
});

test('load', function () {
  var monad = { module: new Module(__filename) };
  var path = '../../test/mocha/fixture/m';
  load(path, monad);
  
  assert(false);
});

