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



test('require cached module', function () {

// normalize first
  var id = normalize(BASEPATH + '/require-test');
  
  Module._load(id); 
  Module._cache[id].exports = 'fake exports';
  assert(require(id) === 'fake exports', 'exports should be faked');
});

test('module api', function () {

// normalize first
  var id = normalize(BASEPATH + '/module-test.js');
  
  delete require.cache[id];
  
  var parent = { id: 'fake parent' };
  var exports = Module._load(id, parent);
  var module = require.cache[id];

  module.id.should.be.equal(id);
  module.filename.should.be.equal(id);
  module.exports.should.be.equal(exports);
  module.exports.should.be.equal(require(id));
  
  module.children.should.be.Array;
  module.parent.should.be.equal(parent);
  module.require.should.be.Function;

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

beforeEach(function () {
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
    hey('there').should.be.equal('[dependent-browser-module]' + there('there'));
    assert(1);

    done();
  });

});

test('load nested', function (done) {

  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  
  ('there := ../../../test/mocha/fixture/browser-module')
  
  (function () {
    assert(1);

    // nested calls are anonymous
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

test('require previously defined path', function () {

  (define)(BASEPATH + './suites/base.js')
  
  (function () {
  
    var b = require('../../../test/mocha/fixture/dependent-browser-module');
    assert(b, 'b not found');
    
    var m = module.require('../../../test/mocha/fixture/dependent-browser-module');
    assert(m === b, 'should get same path');
  });
});

test('require previously defined alias', function () {

  (define)(BASEPATH + './suites/base.js')
  (function () {
  
    var h = require('hey');
    assert(h, 'alias h not found');
    
    var m = module.require('hey');
    assert(m === h, 'should get same alias');
  });
});

test('require(bad path)', function (done) {
  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  (function () {
    var o = require('/bad/path');
    assert(o, 'should return the bare exports object');
    done();
  });
  
});

test('bad import path should execute', function (done) {
  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  
  ('/bad/path')
  
  (function () {
    assert(typeof path == 'undefined', 'should run if bad path not referenced');
    done();
  }); 
  
});

test('verify same namespace runs after bad import path', function (done) {
  global.done = done;

  (define)(BASEPATH + './suites/base.js')
  
  (function () {
    assert(1, 'should execute');
    done();
  });
  
});

