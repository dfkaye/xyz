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

test('define pathnames', function () {
  (define)(__filename)('assert').should.be.Function;

});

test('define callback', function () {
  (define)(__filename)('assert')(function () {
    assert(module.id == 'should fail' /*global.__filename*/);
  }).should.be.Object;
});





