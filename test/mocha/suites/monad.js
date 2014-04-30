// mocha/suites/monad

/* 
 * TEST #1 
 * BY REQUIRING IN THIS ORDER WE VERIFY THAT should() isn't broken by define().
 */
if (typeof require == 'function') {
require('../../../lib/node/monad');
require('should');
}
/* TESTS START HERE */

/*
 * make sure require still works
 */
suite('monad');

test('exists', function () {
  should.should.be.ok
  define.should.be.Function
});

test('assert param is string or function', function () {
  (function() {
    define({}).id(__filename);
  }).should.throw('param must be string or function');
});

test('yes, you can retrieve the current monad and namespace', function () {
  var monad = (define).id(__filename);
  
  monad.should.be.Function;
  monad.namespace.id.should.be.equal(__filename);
});

test('globals', function () {
  (define).id(__filename)
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
  (define).id(__filename)
  (function () {
    module.require.should.be.Function;
    
    module.id.should.be.String;
    module.parent.should.be.ok;
    module.filename.should.be.equal(module.id);
    module.loaded.should.be.true;    
    module.children.should.be.Array;
    
    // testing on windows
    module.children[0].id.replace(/\\/g, '/').should.containEql('/lib/node/monad');
    
    // var path = require('path');
    // console.log(path.normalize('../../../lib/node/monad', module.id));
    
    module.load.should.be.Function;
    // console.log(module.load.toString());
    // module.load(); // throws
    
    (module.parent instanceof module.constructor).should.be.true;
  });
});

test('exports', function () {
  (define).id(__filename)
  (function () {
    module.exports.should.be.ok;
    exports.should.be.equal(module.exports);
    this.should.be.equal(module.exports);
  });
});

test('no context leaks', function () {
  (define).id(__filename)
  (function () {
    (typeof id).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
  });
});

test('returns module.exports', function () {

  var exported = (define).id(__filename)
                  (function () {
                    'use strict';
                    module.exports = { id: 'exported' };
                  });
  
  exported.id.should.be.equal('exported');
});

test('does not return a "return" value', function () {
  
  (f === undefined).should.be.true;
  
  var f = (define).id(__filename)
            ('../fixture/c')
            (function () {
              'use strict';
              c.should.be.Function;
              return c;
            });

  f.should.not.be.Function;
});

test('define.id filename not found', function () {

  (function() {
    (define).id('&8*(D');
  }).should.throw(/Cannot find module/);
});

test('define.id cannot be called more than once', function () {

  (typeof define.id(__filename).id).should.be.equal('undefined');
});


/*
 * make sure require still works
 */
suite('require');

test('"global" require()', function () {

  var c = (define).id(__filename)
              (function () {
                'use strict';
                module.exports = require('../fixture/c');
              });
  
  c('exported').should.be.equal('[c]' + 'exported');
});

test('module.require()', function () {

  var c = (define).id(__filename)
              (function () {
                'use strict';
                module.exports = module.require('../fixture/c');
              });
  
  c('exported').should.be.equal('[c]' + 'exported');
});

test('require.cache', function () {

  (define).id(__filename)
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

  (define).id(__filename)
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

/*
 * various import and execution combinations
 */
suite('import paths');

test('node_modules', function () {
  (define).id(__filename)
  ('fs')
  ('path')
  (function () {
    fs.should.be.ok;
    path.should.be.ok;
  });
});

test('monad requires common', function () {
  (define).id(__filename)
  ('../fixture/c')
  (function() {
    c('test').should.be.equal('[c]' + 'test');
  });
});

test('use strict', function () {

  (define).id(__filename)
  ('../fixture/c')
  (function () {
    'use strict';
    c.should.be.Function;
  });
});

test('multiple dependencies', function() {

  (define).id(__filename)
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

  (define).id(__filename)
  (function () {
    module.hello = 'hello';    
  });
  
  (define).id(__filename)
  (function () {
    module.hello.should.be.equal('hello');    
  });
});

test('pollute other modules by properties', function () {
  (define).id(__filename)
  ('../fixture/c')
  (function () {
    c.hello = 'hello';    
  });
  
  (define).id(__filename)
  ('../fixture/c')
  (function () {
    module.exports.should.not.be.equal(c);
    c.hello.should.be.equal('hello');    
  });
});

test('monad requires monad', function () {
  (define).id(__filename)
  ('../fixture/m')
  (function() {
    m('test').should.be.equal('[m]' + 'test');
  });
});

test('monad requires nested monad', function () {
  (define).id(__filename)
  ('../fixture/m2m')
  (function() {
    m2m('test').should.be.equal('[m2m][m]' + 'test');
  });
});

test('common requires monad', function () {
  (define).id(__filename)
  ('../fixture/c2m')
  (function() {
    c2m('test').should.be.equal('[c2m][m]' + 'test');
  });
});

test('import ./hyphenated-test-module as hyphenatedTestModule', function() {
  (define).id(__filename)
  ('../fixture/hyphenated-test-module')
  (function () {
    hyphenatedTestModule().should.be.equal('hyphenated');
  });
});

test('inner', function () {

  var a = 'a';

  (define).id(__filename)
  ('../fixture/c2m')
  (function() {
  
    var b = 'b';
    
    (typeof a).should.be.equal('undefined');
    c2m('a').should.be.equal('[c2m][m]' + 'a');

    // inner
    
    (define).id(__filename)
    (function() {
    
      (typeof a).should.be.equal('undefined');
      (typeof b).should.be.equal('undefined');
      
      c2m('b').should.be.equal('[c2m][m]' + 'b');
    });
  });
});

test('trim path whitespace', function () {
  (define).id(__filename)
  ('  ../fixture/m   ')
  (function () {  
    m('test').should.be.equal('[m]' + 'test');
  });
});


/*
 * anonymous modules have quirks ~ make sure we ironed them out
 */
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


/*
 * var and path aliases - TODO: global alias
 */
suite('aliasing');

test('nesting', function () {
  (define).id(__filename)
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  (function () {  
    c('test').should.be.equal('[nested c]' + 'test');
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('colliding', function () {
  (define).id(__filename)
  ('../fixture/m')
  ('../fixture/nested/m')
  (function () {  
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('aliasing', function () {
  (define).id(__filename)
  ('../fixture/m')
  ('m2:=../fixture/nested/m')
  (function () {  
    m('test').should.be.equal('[m]' + 'test');
    m2('test').should.be.equal('[nested m]' + 'test');
  });
});

test('path aliasing', function () {
  (define).id(__filename)
  ('../fixture/nested/m:=../fixture/nested/mock')
  (function () {  
    m('test').should.be.equal('[nested mock]' + 'test');
  });
});

test('global with no alias accessed by "global.name"', function () {
  (define).id(__filename)
  ('../fixture/zuber')
  (function () {  
    global.zuber('test').should.be.equal('[global-zuber]' + 'test');
  });
});

test('global alias with "{name} := path"', function () {
  (define).id(__filename)
  ('{zuber}:=../fixture/zuber')
  (function () {  
    zuber('test').should.be.equal('[global-zuber]' + 'test');
  });
});

test('trim alias whitespace', function () {
  (define).id(__filename)
  ('  fm :=  ../fixture/m   ')
  ('  ../fixture/nested/m    :=    ../fixture/nested/mock    ')
  (function () {  
    fm('test').should.be.equal('[m]' + 'test');
    m('test').should.be.equal('[nested mock]' + 'test');
  });
});
