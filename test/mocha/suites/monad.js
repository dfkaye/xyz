// mocha/suites/monad

/* 
 * TEST #1 
 * BY REQUIRING IN THIS ORDER WE VERIFY THAT should() isn't broken by define().
 */
require('../../../lib/node/monad');
require('should');

/* TESTS START HERE */

suite('monad');

test('exists', function () {
  should.should.be.ok
  define.should.be.Function
});

test('assert param is string or function', function () {
  (function() {
    define({}).assert(__filename);
  }).should.throw('param must be string or function');
});

test('globals', function () {
  (define).assert(__filename)
  (function () {
    require.should.be.Function;
    module.should.be.ok;
    exports.should.be.ok;
    global.should.be.ok;
    __dirname.should.be.ok;
    __filename.should.be.ok;
  });
});

test('module', function () {
  (define).assert(__filename)
  (function () {
    module.require.should.be.Function;
    
    module.id.should.be.String;
    module.parent.should.be.ok;
    module.filename.should.be.equal(module.id);
    module.loaded.should.be.true;    
    module.children.should.be.Array;
  });
});

test('exports', function () {
  (define).assert(__filename)
  (function () {
    module.exports.should.be.ok;
    exports.should.be.equal(module.exports);
    this.should.be.equal(module.exports);
  });
});

test('no context leaks', function () {
  (define).assert(__filename)
  (function () {
    (typeof id).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
  });
});

test('returns module.exports', function () {

  var exported = (define).assert(__filename)
                  (function () {
                    'use strict';
                    module.exports = { id: 'exported' };
                  });
  
  exported.id.should.be.equal('exported');
});

test('does not return a "return" value', function () {
  
  (f === undefined).should.be.true;
  
  var f = (define).assert(__filename)
            ('../fixture/c')
            (function () {
              'use strict';
              c.should.be.Function;
              return c;
            });

  f.should.not.be.Function;
});

test('define.assert filename not found', function () {

  (function() {
    (define).assert('&8*(D');
  }).should.throw(/Cannot find module/);
});

test('define.assert cannot be called more than once', function () {

  (typeof define.assert(__filename).assert).should.be.equal('undefined');
});


suite('require');

test('"global" require()', function () {

  var c = (define).assert(__filename)
              (function () {
                'use strict';
                module.exports = require('../fixture/c');
              });
  
  c('exported').should.be.equal('[c]' + 'exported');
});

test('module.require()', function () {

  var c = (define).assert(__filename)
              (function () {
                'use strict';
                module.exports = module.require('../fixture/c');
              });
  
  c('exported').should.be.equal('[c]' + 'exported');
});

test('require.cache', function () {

  (define).assert(__filename)
  ('../fixture/c')
  (function () {
  
    var m = module.constructor._cache;
    var r = require.cache;
    var filename = module.constructor._resolveFilename('../fixture/c', module);
    
    (!!r && !!m && (m === r)).should.be.true;
    (m[filename].exports === c).should.be.true;
    (r[filename].exports === c).should.be.true;
    
    delete r[filename];
    
    (r[filename] === undefined).should.be.true;
    (m[filename] === undefined).should.be.true;
  });
});

test('delete and re-require should.js', function() {

  (define).assert(__filename)
  (function() {
    require.cache['should'].should.be.ok;
    module.constructor._cache['should'].should.be.ok;
    
    delete require.cache['should'];
    (typeof require.cache['should']).should.be.Null;
    (typeof module.constructor._cache['should']).should.be.Null;
    should.should.be.ok;

    // don't do this - it breaks all existing objects and tests with should
    // which defines with ES5 Object.defineProperty
    //delete Object.prototype.should;

    // instead nullify should.should, then verify that require restores it
    should.should = undefined;

    require('should');
    should.should.be.ok;
  });
});


suite('import trees');

test('monad requires common', function () {
  (define).assert(__filename)
  ('../fixture/c')
  (function() {
    c('test').should.be.equal('[c]' + 'test');
  });
});

test('use strict', function () {

  (define).assert(__filename)
  ('../fixture/c')
  (function () {
    'use strict';
    c.should.be.Function;
  });
});

test('multiple dependencies', function() {

  (define).assert(__filename)
  ('../fixture/m')
  ('../fixture/c')
  (function () {  
    m.should.be.Function;
    c.should.be.Function;
  });
  
  (typeof m).should.be.equal('undefined');
  (typeof c).should.be.equal('undefined');
});

test('pass values by module properties', function() {

  (define).assert(__filename)
  (function () {
    module.hello = 'hello';    
  });
  
  (define).assert(__filename)
  (function () {
    module.hello.should.be.equal('hello');    
  });
});

test('pollute other modules by properties', function () {
  
  (define).assert(__filename)
  ('../fixture/c')
  (function () {
    c.hello = 'hello';    
  });
  
  (define).assert(__filename)
  ('../fixture/c')
  (function () {
    module.exports.should.not.be.equal(c);
    c.hello.should.be.equal('hello');    
  });
});

test('monad requires monad', function () {
  (define).assert(__filename)
  ('../fixture/m')
  (function() {
    m('test').should.be.equal('[m]' + 'test');
  });
});

test('monad requires nested monad', function () {
  (define).assert(__filename)
  ('../fixture/m2m')
  (function() {
    m2m('test').should.be.equal('[m2m][m]' + 'test');
  });
});

test('common requires monad', function () {
  (define).assert(__filename)
  ('../fixture/c2m')
  (function() {
    c2m('test').should.be.equal('[c2m][m]' + 'test');
  });
});

test('import ./hyphenated-test-module as hyphenatedTestModule', function() {

  (define).assert(__filename)
  ('../fixture/hyphenated-test-module')
  (function () {
    hyphenatedTestModule().should.be.equal('hyphenated');
  });
});

test('inner', function () {

  var a = 'a';

  (define).assert(__filename)
  ('../fixture/c2m')
  (function() {
  
    var b = 'b';
    
    (typeof a).should.be.equal('undefined');
    c2m('a').should.be.equal('[c2m][m]' + 'a');

    // inner
    
    (define).assert(__filename)
    (function() {
    
      (typeof a).should.be.equal('undefined');
      (typeof b).should.be.equal('undefined');
      
      c2m('b').should.be.equal('[c2m][m]' + 'b');
    });
  });
});


suite('anonymous');

test('dependency paths must be root-relative', function () {

  (define)
  ('../../test/mocha/fixture/c2m')
  (function() {
  
    c2m('a').should.be.equal('[c2m][m]' + 'a');
    
    // anonymous inner
    
    (define)
    ('../../test/mocha/fixture/m')
    
    (function () {
      c2m('b').should.be.equal('[c2m][m]' + 'b');
      m('bob').should.be.equal('[m]' + 'bob');
    });
  });
});

test('require node_modules', function () {
  (define)
  ('fs')
  ('path')
  (function () {
    fs.should.be.ok;
    path.should.be.ok;
  });
});



suite('aliasing');

test('nesting', function () {
  (define).assert(__filename)
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  (function () {  
    c('test').should.be.equal('[nested c]' + 'test');
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('colliding', function () {
  (define).assert(__filename)
  ('../fixture/m')
  ('../fixture/nested/m')
  (function () {  
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('aliasing', function () {
  (define).assert(__filename)
  ('../fixture/m')
  ('m2:=../fixture/nested/m')
  (function () {  
    m('test').should.be.equal('[m]' + 'test');
    m2('test').should.be.equal('[nested m]' + 'test');
  });
});

test('path aliasing', function () {
  (define).assert(__filename)
  ('../fixture/nested/m:=../fixture/nested/mock')
  (function () {  
    m('test').should.be.equal('[nested mock]' + 'test');
  });
});