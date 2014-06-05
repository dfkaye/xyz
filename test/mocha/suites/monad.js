// mocha/suites/monad

/* 
 * TEST #1 
 * BY REQUIRING IN THIS ORDER WE VERIFY THAT should() isn't broken by define().
 */
require('../../../lib/node/monad');
require('should');


////////////////////////////////////////////////
//
// CONVERT SHOULD TESTS TO ASSERT
//
////////////////////////////////////////////////


/* TESTS START HERE */

/*
 * make sure require still works
 */
suite('define');

test('define should be global', function () {
  should.should.be.ok
  global.define.should.be.Function
});

test('these should not be global', function () {
  ('assert' in global).should.be.false;
  ('namespace' in global).should.be.false;
  ('Module' in global).should.be.false;
});

test('assert id is string', function () {
  (function() {
    (define)({})
  }).should.throw('id must be string');
});

test('assert param is string or function', function () {
  (function() {
    (define)(__filename)
    ({});
  }).should.throw('param must be string or function');
});

test('scope globals', function () {
  (define)(__filename)
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
  (define)(__filename)
  (function () {
    module.require.should.be.Function;
    
    module.id.should.be.String;
    module.parent.should.be.ok;
    module.filename.should.be.equal(module.id);
    module.loaded.should.be.true;    
    module.children.should.be.Array;
    
    (module.parent instanceof module.constructor).should.be.true;
    module.parent.constructor.should.be.equal(module.constructor);
  });
});

test('module.load() should be undefined', function () {
  (define)(__filename)
  (function () {
    (typeof module.load).should.be.equal('undefined');
  });
});

test('exports', function () {
  (define)(__filename)
  (function () {
    module.exports.should.be.ok;
    exports.should.be.equal(module.exports);
    this.should.be.equal(module.exports);
  });
});

test('no context leaks', function () {
  (define)(__filename)
  (function () {
    (typeof id).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
  });
});

test('returns module.exports', function () {

  var exported = (define)(__filename)
                  (function () {
                    'use strict';
                    module.exports = { id: 'exported' };
                  });
  
  exported.id.should.be.equal('exported');
});

test('does not return a "return" value', function () {
  
  (f === undefined).should.be.true;
  
  var f = (define)(__filename)
            ('../fixture/c')
            (function () {
              'use strict';
              c.should.be.Function;
              return c;
            });

  f.should.not.be.Function;
});

test('intercept namespace define, then continue', function () {
  
  // intercept it from the initial statement
  var monad = (define)(__filename);
  
  monad.should.be.Function;
  monad.context.id.should.be.equal(__filename);
  
  // continue using it
  var exports = (monad)
  (function() {
    exports.current = true;
  });
  
  exports.current.should.be.true;
});

test('define filename not found', function () {

  (function() {
    (define)('&8*(D');
  }).should.throw(/Cannot find module/);
});


/*
 * make sure require still works
 */
suite('require');

test('"global" require()', function () {

  var c = (define)(__filename)
              (function () {
                'use strict';
                module.exports = require('../fixture/c');
              });
  
  c('exported').should.be.equal('[c]' + 'exported');
});

test('module.require()', function () {

  var c = (define)(__filename)
              (function () {
                'use strict';
                module.exports = module.require('../fixture/c');
              });
  
  c('exported').should.be.equal('[c]' + 'exported');
});

test('require.resolve', function () {
  var c = (define)(__filename)
              (function () {
                'use strict';
                module.exports = require.resolve('../fixture/c');
              });
  
  // tested on windows
  c.replace(/\\/g, '/').should.containEql('/fixture/c');
});

test('require.cache', function () {

  (define)(__filename)
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

  (define)(__filename)
  (function() {
    require.cache['should'].should.be.ok;
    module.constructor._cache['should'].should.be.ok;
    
    delete require.cache['should'];
    //(require.cache['should']).should.be.Null;
    //(typeof module.constructor._cache['should']).should.be.Null;
    should.should.be.ok;

    /*
     * Don't do this with should.js - it breaks all existing objects and tests 
     * with should which defines with ES5 Object.defineProperty
     */
    //delete Object.prototype.should;

    // instead, nullify should.should, then verify that require() restores it
    should.should = undefined;
    require('should');
    should.should.be.ok;
  });
});


/* 
 * CYCLES SHOULD ALWAYS FAIL, BUT NODE.JS "FIXES" CYCLES WITH PROXY OBJECTS 
 * INSTEAD OF RETURNING THEIR EXPORTS. 
 * THAT IS REALLY TERRIBLE.
 */
suite('import cycles should always throw');

test('file cannot require itself', function() {

  (function() {
    (define)(__filename)
    (__filename)
    (function () {
      monad.should.not.be.ok;
    });
  }).should.throw();
});

test('dependency cannot require itself', function() {

  (function() {
    (define)(__filename)
    ('../fixture/self-cycle')
    (function () {
      selfCycle.should.not.be.ok;
    });
  }).should.throw();
});

test('deep cycle throws', function() {

  (function(){
    (define)(__filename)
    ('../fixture/cycle')
    (function () {
      // cycle requires nested/cycle
      // nested/cycle requires cycle, 
      // and attaches 'nested' property to imported cycle
      cycle.nested.should.not.be.ok;
    });
  }).should.throw();
});


/*
 * various import and execution combinations
 */
suite('import paths');

test('node_modules', function () {
  (define)(__filename)
  ('fs')
  ('path')
  (function () {
    fs.should.be.ok;
    path.should.be.ok;
  });
});

test('monad requires common', function () {
  (define)(__filename)
  ('../fixture/c')
  (function() {
    c('test').should.be.equal('[c]' + 'test');
  });
});

test('use strict', function () {

  (define)(__filename)
  ('../fixture/c')
  (function () {
    'use strict';
    c.should.be.Function;
  });
});

test('multiple dependencies', function() {

  (define)(__filename)
  ('../fixture/m')
  ('../fixture/c')
  (function () {
    m.should.be.Function;
    c.should.be.Function;
  });
  
  (typeof m).should.be.equal('undefined');
  (typeof c).should.be.equal('undefined');
});

test('windows path separator handled', function() {
  (define)(__filename)
  ('..\\fixture\\m')
  (function () {
    m.should.be.Function;
  });
});

test('pass values by module properties', function() {

  (define)(__filename)
  (function () {
    module.hello = 'hello';    
  });
  
  (define)(__filename)
  (function () {
    module.hello.should.be.equal('hello');    
  });
});

test('pollute other modules by properties', function () {
  (define)(__filename)
  ('../fixture/c')
  (function () {
    c.hello = 'hello';    
  });
  
  (define)(__filename)
  ('../fixture/c')
  (function () {
    module.exports.should.not.be.equal(c);
    c.hello.should.be.equal('hello');    
  });
});

test('monad requires monad', function () {
  (define)(__filename)
  ('../fixture/m')
  (function() {
    m('test').should.be.equal('[m]' + 'test');
  });
});

test('monad requires nested monad', function () {
  (define)(__filename)
  ('../fixture/m2m')
  (function() {
    m2m('test').should.be.equal('[m2m][m]' + 'test');
  });
});

test('common requires monad', function () {
  (define)(__filename)
  ('../fixture/c2m')
  (function() {
    c2m('test').should.be.equal('[c2m][m]' + 'test');
  });
});

test('import ./hyphenated-test-module as hyphenatedTestModule', function() {
  (define)(__filename)
  ('../fixture/hyphenated-test-module')
  (function () {
    hyphenatedTestModule().should.be.equal('hyphenated');
  });
});

test('trim path whitespace', function () {
  (define)(__filename)
  ('  ../fixture/m   ')
  (function () {
    m('test').should.be.equal('[m]' + 'test');
  });
});

test('support very relative pathnames', function () {

  (define)(__filename)
  ('../../../test/mocha/fixture/c2m')
  (function() {
  
    c2m('a').should.be.equal('[c2m][m]' + 'a');
    
    // inner
    (define)
    ('../fixture/m')
    (function () {
      c2m('b').should.be.equal('[c2m][m]' + 'b');
      m('bob').should.be.equal('[m]' + 'bob');
    });
  });
});


suite('nested modules');

test('inner does not see outer vars', function () {

  var a = 'a';

  // outer named context
  (define)(__filename)
  ('../fixture/c2m')
  (function() {
  
    var b = 'b';
    
    (typeof a).should.be.equal('undefined');
    c2m('a').should.be.equal('[c2m][m]' + 'a');

    // inner define call on same context
    (define)
    (function() {
    
      (typeof a).should.be.equal('undefined');
      (typeof b).should.be.equal('undefined');
      
      c2m('b').should.be.equal('[c2m][m]' + 'b');
    });
  });
});

test('inner define with error', function () {

  (function(){
    (define)(__filename)
    (function() {
      
      // inner define on same filename should cycle
      var inner = (define)(__filename)
      (function () {
        module.exports = 'should cycle';
      });
      inner.should.be.equal('should cycle');
    });
  }).should.not.throw();
});

test('inner context can require node_modules', function () {

  (define)(__filename)
  (function() {
  
    (define)
    ('fs')
    ('path')
    (function () {
      fs.should.be.ok;
      path.should.be.ok;
    });
  });
});

test('pass values to nested modules via module properties', function() {

  (define)(__filename)
  
  (function () {
    module.outer = 'hello';

    (define)
    (function () {
      module.outer.should.be.equal('hello');    
    });
  });
});

test('inner exports should not clobber outer exports', function() {

  var exported = (define)(__filename)
  
  (function () {
    module.exports = 'hello';

    var inner = (define)
    (function () {
      module.exports = 'whatever';    
    });
    
    inner.should.be.equal('whatever');
  });
  
  exported.should.be.equal('hello');
});

/*
 * varname, pathname and global aliases
 */
suite('aliasing');

test('nesting', function () {
  (define)(__filename)
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  (function () {
    c('test').should.be.equal('[nested c]' + 'test');
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('colliding', function () {
  (define)(__filename)
  ('../fixture/m')
  ('../fixture/nested/m')
  (function () {
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('aliasing', function () {
  (define)(__filename)
  ('../fixture/m')
  ('m2 := ../fixture/nested/m')
  (function () {
    m('test').should.be.equal('[m]' + 'test');
    m2('test').should.be.equal('[nested m]' + 'test');
  });
});

test('path aliasing', function () {
  (define)(__filename)
  ('../fixture/nested/m := ../fixture/nested/mock')
  (function () {
    m('test').should.be.equal('[nested mock]' + 'test');
  });
});

test('global with no alias accessed by "global.name"', function () {
  (define)(__filename)
  ('../fixture/zuber')
  (function () {
    global.zuber('test').should.be.equal('[global-zuber]' + 'test');
  });
});

test('global alias with "{name} := path"', function () {
  (define)(__filename)
  ('{zuber} := ../fixture/zuber')
  (function () {
    zuber('test').should.be.equal('[global-zuber]' + 'test');
  });
});

test('trim alias whitespace', function () {
  (define)(__filename)
  ('  fm :=  ../fixture/m   ')
  ('  ../fixture/nested/m    :=    ../fixture/nested/mock    ')
  (function () {
    fm('test').should.be.equal('[m]' + 'test');
    m('test').should.be.equal('[nested mock]' + 'test');
  });
});

// wrap suite - hence aliases - inside def
(define)(__filename)
('m := ../fixture/m')
(function () {

  suite('wrapped suite');
  
  test('first', function () {
    m.should.be.ok;
  });
  
  test('second', function () {
    m.should.be.ok;
  });
  
  (define)
  (function () {
  
    suite('wrapped and nested suite');
    
    test('first', function () {
      m.should.be.ok;
    });
    
    test('second', function () {
      m.should.be.ok;
    });
  });
});


suite('csp sandbox');

test('sandbox api', function () {

  var sandbox = define.sandbox;

  var before = 'before';
  var exports = before;
  
  var module = { exports: before, 
                 load: function () { 
                   throw new Error('module.load() should be undefined'); 
                 }
               };

  var context = { id: 'csp test',
                  after: function () { return 'after'; },
                  module: module,
                  exports: exports
                };
                
  var fn = function (after) {
    (typeof after).should.be.equal('function');
    (typeof module.load).should.be.equal('undefined');

    module.exports = after();
  };
  
  var globals = { define: define, require: require };
  
  var result = sandbox(fn, context, globals);
  
  result.should.be.equal('after');
});

test('define.exec detects argname, runs sandbox', function () {
   
  var before = 'before';
  var exports = before;
  var module = { exports: exports };

  var context = { id: 'csp multi arg test',
                  after: function () { return 'after'; },
                  module: module,
                  exports: exports,
                  later: function () { return 'later'; }
                };
                
  var monad = { context: context };
  
  var fn = function (after, later) {
    (typeof after).should.be.equal('function');
    (typeof later).should.be.equal('function');
    
    module.exports = after() + later();
  };

  var result = define.exec(fn, monad);
  
  result.should.be.equal('after' + 'later');
});

test('with real dependencies', function () {

  (define)(__filename)
  
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  
  (function (m, c) {
  
    c('test').should.be.equal('[nested c]' + 'test');
    m('test').should.be.equal('[nested m]' + 'test');
  });
});

test('nested sandbox sees outer vars', function () {

  (define)(__filename)
  
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  
  (function (m, c) {
  
    c('test').should.be.equal('[nested c]' + 'test');
    
    var b = 'visible';
    
    (define)
    (function (m) {
      m('test').should.be.equal('[nested m]' + 'test');
      b.should.be.equal('visible');
    });
    
  });
});
