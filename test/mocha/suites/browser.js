// mocha/suites/browser

global.BASEPATH = document.location.href.substring(0, document.location.href.lastIndexOf('/') + 1);

suite('browser globals');

before(function () {
  global.assert = require('assert');
});

test('assert', function () {
  assert('assert');
});

test('global', function () {
  assert(global === window);
});

test('require', function () { 
  assert(typeof require == 'function', 'require should be a function');
});

test('define', function () {
  assert(typeof define === 'function', 'define should be a function');
});


suite('resolve/normalize pathnames');

before(function () {
  this.resolve = require('module')._resolveFilename;
  this.href = document.location.href;
  this.dirname = this.href.substring(0, this.href.lastIndexOf('/'));
  this.prefix = document.location.protocol + '//' + document.location.host;
});

test('path', function () {
  assert(this.resolve('path') === this.href + '/path' + '.js');
});

test('/path', function () {
  assert(this.resolve('/path') === this.href + '/path' + '.js');
});

test('./path', function () {
  assert(this.resolve('./path') === this.href + '/path' + '.js');
});

test('../path', function () {
  assert(this.resolve('../path') === this.dirname + '/path' + '.js');
});

test('""', function () {
  assert(this.resolve('') === this.href + '.js', this.resolve(''));
});

test('.', function () {
  assert(this.resolve('.') === this.href + '.js', this.resolve('.'));
});

test('/', function () {
  assert(this.resolve('/') === this.href + '.js', this.resolve('/'));
});

test('./', function () {
  assert(this.resolve('./') === this.href + '.js', this.resolve('./'));
});

test('//', function () {
  assert(this.resolve('//') === this.href + '.js', this.resolve('//'));
});

test('..', function () {
  assert(this.resolve('..') === this.dirname  + '.js', this.resolve('..'));
});

test('../', function () {
  assert(this.resolve('../') === this.dirname  + '.js',  this.resolve('../'));
});

test('./path, dirname', function () {
  var dir = this.prefix + '/dir';
  var parent = { id: dir + '/test/' };
  var actual = this.resolve('./path', parent);

  assert(actual === parent.id + 'path.js', actual);
});

test('./path, filename.js', function () {
  var dir = this.prefix + '/dir';
  var parent = { id: dir + '/filename.js' };
  var actual = this.resolve('./path', parent);

  assert(actual === dir + '/path.js', actual);
});

test('../path, dirname', function () {
  var dir = this.prefix + '/dir';
  var parent = { id: dir + '/test/' };
  var actual = this.resolve('../path', parent);

  assert(actual === dir + '/path.js', actual);
});

test('../path, filename.js', function () {
  var dir = this.prefix + '/dir';
  var parent = { id: dir + '/filename.js' };
  var actual = this.resolve('../path', parent);
  
  assert(actual === this.prefix + '/path.js', actual);
});

test('/foo//bar/../baz////././../baz/spam, filename.js', function () {
  var dir = this.prefix + '/dir';
  var parent = { id: dir + '/filename.js' };
  var actual = this.resolve('/foo//bar/../baz////././../baz/spam', parent);
  
  assert(actual === dir + '/foo/baz/spam.js', actual);
});


suite('browser builtins');

test('require("module")', function () {
  var Module = require('module');
  var cache = Module._cache[Module._resolveFilename('module')];
    
  assert(Module, 'Module not loaded');
  assert(typeof Module == 'function', 'Module should be function');
  assert(cache.exports === Module, 'bad cache');  
});

test('require.resolve', function () {  
  assert(require.resolve('module') === document.location.href + '/module.js');
});

test('Module load, cache and require', function () {
  function fake(s) { return 'fake ' + s; }
  
  var Module = require('module');
  var fakeID = Module._resolveFilename('fake');

  Module._load(fakeID);
  Module._cache[fakeID].exports = fake;
  
  assert(require('fake')('test') === 'fake test', 'should return fake test');
});

test('module api', function () {

  var id = require.resolve(BASEPATH + '/module-test.js');
  
  delete require.cache[id];
  
  var parent = { id: 'fake parent' };
  var exports = Module._load(id, parent);
  var module = require.cache[id];

  assert(module.id === id, 'module.id should equal id');
  assert(module.filename === id, 'module.filename should equal id');
  assert(module.exports === exports, 'module.exports should equal exports');
  assert(exports === require(id), 'exports should equal require(id)');
  assert('length' in module.children, 'module.children should be Array');
  assert(module.parent === parent, 'module.parent should equal parent');
  assert(typeof module.require === 'function', 'module.require should be function');
});


suite('define');

beforeEach(function () {
  this.pathId = require.resolve('./fake/path', { id: __filename});
});

test('(define)(__filename)', function () {
  var pathId = this.pathId;
  
  var m = (define)(pathId);
  
  assert(typeof m == 'function', 'should return function');
});

test("(define)(__filename)('./fake/path')", function () {
  var pathId = this.pathId;
  
  (define)(pathId)
  (function () {
    module.exports = 'testing fake';
  });
  
  var m = (define)(pathId)('./fake/path');
  
  assert(typeof m == 'function', 'should return function');
});

test("(define)(__filename)('./fake/path')(function() {});", function () {
  var pathId = this.pathId;
  
  var exported = (define)(__filename)(pathId)(function() {
    assert(module.id === __filename, 'module.id should be ' + __filename);
    module.exports = path; 
  });
  
  assert(exported === 'testing fake', 'should export pathId');
});


suite('exec');

before(function () {
  this.pathId = BASEPATH + 'fake/path.js';
});

test("exec", function () {
  var pathId = this.pathId;

  var exported = (define)(pathId)(function() {
    assert(module.id == global.BASEPATH + 'fake/path.js', 'id incorrect');
    module.exports = "OK";
  });
  
  assert(exported == 'OK', 'should return OK');
});

test("exec __dirname is localized", function () {
  var pathId = this.pathId;
  
  (define)(pathId)(function () {
    assert(module.id == __dirname + '/path' + '.js', '__dirname incorrect');
  });
});

test("exec new exports", function () {
  var pathId = this.pathId;
  
  var exported = (define)(pathId)(function () {
    assert(module.exports == 'OK', 'should return previous export value');
    
    // set new value
    module.exports = 'faked-path';
  });
  
  assert(exported == 'faked-path', 'should set new exports value');
});

test("nested define", function () {
  var imports = this.pathId;

  (define)('anon')
  (imports)
  (function() {
    assert(path == 'faked-path', 'path should be faked-path');
    
    (define)
    (function() {
      assert(path === 'faked-path', 'should still be faked-path');
    });
  });
});


suite('script');

test('require("script")', function () {
  var script = require('script');
  
  assert(typeof script == 'function', 'script api not right');
});

test('error', function () {
  var filename = 'bad file name';
  var parent = { id: 'anything' };
  var script = require('script');
  
  script({ filename: filename, parent: parent, onload: function(err, done) {
    assert(err.message == 'file not found: ' + filename, 'script err message');
  }});
});

test('ok', function () {
  var filename = require.resolve('../../../test/mocha/fixture/browser-module');
  var parent = { id: BASEPATH + './suites/base.js' };  
  var script = require('script');
  
  script({ filename: filename, parent: parent, onload: function(err, done) {
    assert(!err, filename + 'should load browser module');
  }});
});

test('script.cache', function () {
  var filename = require.resolve('../../../test/mocha/fixture/browser-module');
  var script = require('script');

  assert(script.cache[filename] instanceof Image, 'no img at: ' + filename);
//  assert(script.cache[filename].script, 'no script at: ' + filename);
});


test('load', function (done) {
  global.doneLoad = done;

  (define)(BASEPATH + './suites/base.js')
  ('a := ../../../test/mocha/fixture/browser-module')
  ('b := ../../../test/mocha/fixture/dependent-browser-module')
  (function () {
  
    var s = '[dependent-browser-module]' + a('success');
    assert(b('success') === s, 'should be dep + mod success');

    global.doneLoad();
    delete global.doneLoad;
  });
});

test('load again', function (done) {
  global.doneAgain = done;

  (define)(BASEPATH + './suites/base.js')
  ('a := ../../../test/mocha/fixture/browser-module')
  ('b := ../../../test/mocha/fixture/dependent-browser-module')
  (function () {

    var s = '[dependent-browser-module]' + a('success again');
    assert(b('success again') === s, 'should be dep + mod success again');

    global.doneAgain();
    delete global.doneAgain;
  });
});

test('load in reverse', function (done) {
  global.doneReverse = done;

  (define)(BASEPATH + './suites/base.js')
  ('hey := ../../../test/mocha/fixture/dependent-browser-module')
  ('there := ../../../test/mocha/fixture/browser-module')
  (function () {
  
    var s = '[dependent-browser-module]' + there('there');
    assert(hey('there') === s, 'should be hey there');

    global.doneReverse();
    delete global.doneReverse;
  });
});

test('load nested', function (done) {
  global.doneNested = done;

  (define)(BASEPATH + './suites/base.js')
  ('there := ../../../test/mocha/fixture/browser-module')
  (function () {
    assert(there, 'there not defined');

    // nested calls are anonymous
    (define)
    ('hey := ../../../test/mocha/fixture/dependent-browser-module')
    (function () {
    
      var s = '[dependent-browser-module]' + there('there');
      assert(hey('there') === s, 'should be hey there');
    });
    
    assert(there('there') === '[browser-module]' + 'there', 'should be there');

    global.doneNested();
    delete global.doneNested;
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
  global.doneRequireBadPath = done;

  (define)(BASEPATH + './suites/base.js')
  (function () {
  
    var o = require('/bad/path');
    
    assert(o, 'should return the bare exports object');
    
    global.doneRequireBadPath();
    delete global.doneRequireBadPath;
  });
});

test('bad import path should execute', function (done) {
  global.doneBadPath = done;

  (define)(BASEPATH + './suites/base.js')
  ('/bad/path')
  (function () {
    assert(typeof path == 'undefined', 'should run if bad path not referenced');
    
    global.doneBadPath();
    delete global.doneBadPath;
  });
});

test('verify same namespace runs after bad import path', function (done) {
  global.doneSame = done;

  (define)(BASEPATH + './suites/base.js')
  (function () {
    assert(1, 'should execute');
    
    global.doneSame();
    delete global.doneSame;
  });
});


suite('csp sandbox');

test('exec should run csp sandbox when param detected in fn arg', function () {

  var exported = (define)(BASEPATH + './suites/csp-sandbox-test.js')
  ('../../../test/mocha/fixture/browser-module')
  (function (browserModule) {
    module.exports = browserModule('[sandbox]');
  });

  assert(exported == '[browser-module]' + '[sandbox]', 'sandbox msg incorrect');
});