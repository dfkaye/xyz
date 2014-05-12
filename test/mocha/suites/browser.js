// mocha/suites/browser
suite('browser');

var host = document.location.protocol + '//' + document.location.host;

test('global', function () {
  global.should.be.equal(window);
  global.__filename.should.be.equal(__filename);
  global.__dirname.should.be.equal(__dirname);
});

test('__filename', function () {
  __filename.should.be.equal(host + '/lib/browser/monad.js');
});

test('normalize', function () {
  normalize(host + '/lib/browser/monad.js').should.be.equal(__filename);
  normalize(BASEPATH + '../../lib/browser/monad.js').should.be.equal(__filename);
});
      
test('__dirname', function () {
  __dirname.should.be.equal(host + '/lib/browser');
});

test('BASEPATH is document.location.href', function () {
  var pathname = document.location.pathname;
  BASEPATH.should.be.equal(host + pathname.substring(0, pathname.lastIndexOf('/') + 1));
});

test('require', function () {
  require(__filename).should.be.Function;
});

test('module', function () {
  var name = normalize(__filename);
  delete require._cache[name];
  
  Module._load(__filename, { id: __filename });
  
  require._cache[name].id.should.be.equal(name);
  require._cache[name].filename.should.be.equal(name);
  require._cache[name].exports.should.be.equal(require(name));
  require._cache[name].children.should.be.Array;
  require._cache[name].parent.should.be.Object;
  require._cache[name].require.should.be.Function;

});

test('define __filename', function () {
  (define)(__filename).should.be.Function;
  (define)(__filename).id.should.be.equal(__filename);
});

test('define with builtin pathnames', function () {
  (define)(__filename)('assert').should.be.Function;

});

test('define callback', function () {
  (define)(__filename)
  ('assert')
  (function () {
    assert(module.id == __filename /*global.__filename*/);
  }).should.be.Object;
});

test('camelize', function () {
  (define)(__filename)
  ('camelize')
  (function () {
    camelize('kenneth/rex-read.js').should.be.equal('rexRead');
  });
});

test('make', function () {
  (define)(__filename)
  ('make')
  (function () {
    make.should.be.Function;
  });
});

test('Module, using alias', function () {
  (define)(__filename)
  ('Module := module')
  (function () {
    Module.should.be.Function;
  });
});

test('normalize', function () {
  (define)(__filename)
  ('normalize')
  (function () {
    normalize.should.be.Function;
  });
});


