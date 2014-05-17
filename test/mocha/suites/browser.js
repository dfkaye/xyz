// mocha/suites/browser

suite('browser globals');

test('assert', function () {
  assert('assert');
});

test('global', function () {
  assert(global === window);
});

test('__filename', function () {
  var name = '/lib/browser/monad.js';
  var length = name.length;
  
  assert(__filename.indexOf(name) === __filename.length - name.length);
});

test('__dirname', function () {
  var name = '/lib/browser';
  var length = name.length;
  
  assert(__dirname.indexOf(name) === __dirname.length - name.length);
});



// global.BASEPATH = document.location.href.substring(0, document.location.href.lastIndexOf('/') + 1);



suite('_resolveFilename');

test('BASEPATH', function () {
  var name = '/test/mocha/';
  var length = name.length;
  
  assert(BASEPATH.indexOf(name) === BASEPATH.length - name.length);
});

test('with __filename', function () {
  var id = 'fake/path';
  var path = __dirname + '/' + id + '.js';

  Module._resolveFilename('./' + id, { id: __filename }).should.be.equal(path);
});

test('with BASEPATH', function () {
  var id = 'fake/path';

  var testId = BASEPATH + '/test.js';
  var testpath = BASEPATH + id + '.js';

  Module._resolveFilename('./' + id, { id: testId }).should.be.equal(testpath);
});


suite('define');

beforeEach(function () {
  this.pathId = Module._resolveFilename('./fake/path', { id: __filename});
});

test('define', function () {
  assert(typeof define === 'function');
});

test('(define)(__filename)', function () {
  (define)(__filename).should.be.Function;
});

test("(define)(__filename)('./fake/path')", function () {
  var pathId = this.pathId;
  
  define(pathId)
  (function () {
    module.exports = 'testing fake';
  });
  
  (define)(__filename)('./fake/path').should.be.Function;
});

test("(define)(__filename)('./fake/path')(function() {});", function () {
  var pathId = this.pathId;
  
  var exported = (define)(__filename)('./fake/path')(function() {

    module.id.should.be.equal(__filename);
    
    module.exports = path; 
  });
  
  assert(exported === 'testing fake', 'should export pathId');
});



suite('exec with BASEPATH');

test("exec", function () {
  var pathId = BASEPATH + 'fake/path.js';

  var exported = (define)(pathId)
  (function() {
    module.exports = "OK";
    
    module.id.should.be.equal(global.BASEPATH + 'fake/path.js');
  });
  
  exported.should.be.equal("OK");
});

test("exec __dirname is localized", function () {

  var pathId = BASEPATH + 'fake/path.js';
  
  (define)(pathId)
  (function () {
    // remember, this __dirname is local to this module !!!
    module.id.should.be.equal(__dirname + '/path' + '.js');

    // assert previous export value
    module.exports.should.be.equal("OK");
    
    // set new value
    module.exports = 'faked-path';
  });
  
});

test("nested define", function () {

  var pathId = BASEPATH + 'fake/path.js';

  (define)('anon')
  (pathId)
  (function() {
  
    //assert new value
    assert(path == 'faked-path', 'path should be faked-path');
    
    (define)
    (function() {
    
      assert(path === 'faked-path', 'should still be faked-path');
    });
  });
  
});


suite('script');

afterEach(function () {
  delete global.done;
});

test('load', function (done) {

  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  ('a := ../../../test/mocha/fixture/browser-module')
  ('b := ../../../test/mocha/fixture/dependent-browser-module')
  (function () {
    b('success').should.be.equal('[dependent-browser-module]' + a('success'));
    assert(1);
    done();
  });

});

test('load again', function (done) {

  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  ('a := ../../../test/mocha/fixture/browser-module')
  ('b := ../../../test/mocha/fixture/dependent-browser-module')
  (function () {
    b('success again').should.be.equal('[dependent-browser-module]' + a('success again'));
    assert(1);

    done();
  });
  
});

test('load in reverse', function (done) {

  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  ('hey := ../../../test/mocha/fixture/dependent-browser-module')
  ('there := ../../../test/mocha/fixture/browser-module')
  (function () {
    //hey('there').should.be.equal('[dependent-browser-module]' + there('there'));
    //assert(1);

    done();
  });

});

test('load nested', function (done) {

  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  ('there := ../../../test/mocha/fixture/browser-module')
  (function () {
    assert(1);

    (define)
    ('hey := ../../../test/mocha/fixture/dependent-browser-module')
    (function () {
      assert(1);
      hey('there').should.be.equal('[dependent-browser-module]' + there('there'));
    });
    
    there('there').should.be.equal('[browser-module]' + 'there');
  
    done();
  });
  
});