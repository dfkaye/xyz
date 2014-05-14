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
  Module._resolveFilename('./' + id, { id: __filename }).should.be.equal(__dirname + '/' + id + '.js');
  Module._resolveFilename('./' + id, { id: BASEPATH + '/test.js' }).should.be.equal(BASEPATH + id + '.js');
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
  var exported = (define)(BASEPATH + 'fake/path.js')
  (function() {
    module.exports = "OK";
    
    module.id.should.be.equal(global.BASEPATH + 'fake/path.js');
  });
  
  exported.should.be.equal("OK");
});

test("exec __dirname is localized", function () {
  (define)(BASEPATH + 'fake/path.js')
  (function () {
    // remember, this __dirname is local to this module !!!
    module.id.should.be.equal(__dirname + '/path' + '.js');
    
    // assert previous export value
    module.exports.should.be.equal("OK");
    
    // set new value
    module.exports = 'faked-path';
  });
  
  (define)(__filename)
  ('../../test/mocha/fake/path')
  (function() {
  
    // assert new value
    assert(path == 'faked-path', 'path should be faked-path');
  });
  
  //console.log(registry);
});



suite.only('script load cache');

test('loadcache', function () {
  var cache = loadcache();
  var scripts = document.scripts || document.getElementsByTagName('script');
  assert(cache.length === scripts.length);
});

test('load', function () {

  var monad = { module: new Module(BASEPATH + 'base.js') };
  var path = '../../test/mocha/fixture/dependent-browser-module';

  var filename = Module._resolveFilename(path, monad.module);

  load(filename, monad)
  
  assert(false);
});

