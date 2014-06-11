// mocha/suites/monad

require('../../../lib/node/monad');

var assert = require('assert');

/* TESTS START HERE */

/*
 * make sure require still works
 */
suite('define');

test('define should be global', function () {
  assert(typeof global.define == 'function', 'define should be function');
});

test('these should not be global', function () {
  assert(!('assert' in global), 'assert should not be global');
  assert(!('namespace' in global), 'namespace should not be global');
  assert(!('Module' in global), 'Module should not be global');
});

test('assert id is string', function () {
  assert.throws(function() {
    (define)({})
  }, 'id must be string');
});

test('assert param is string or function', function () {
  assert.throws(function() {
    (define)(__filename)
    ({});
  }, 'param must be string or function');
});

test('scope globals', function () {
  (define)(__filename)
  (function () {
    var assert = require('assert');
    
    assert(typeof require == 'function', 'require should be function');
    assert(module, 'module should be object');
    assert(exports, 'exports should be object');
    assert(global, 'global should be object');
    assert(typeof __dirname == 'string', '__dirname should be string');
    assert(typeof __filename == 'string', '__filename should be string');
  });
});

test('module', function () {
  (define)(__filename)
  (function () {
    var assert = require('assert');
    
    assert(typeof module.require == 'function', 
           'module.require should be function');
    assert(typeof module.id == 'string', 'module.id should be string');
    assert(module.filename === module.id, 'module.filename should be id');
    assert(module.parent, 'module.parent should be object');
    assert(module.loaded, 'module.loaded should be true');
    assert(typeof module.children.length == 'number', 
           'module.children should be array');
    assert(module.parent instanceof module.constructor, 
           'module.parent should be a module instance');
    assert(module.parent.constructor === module.constructor, 
           'module.parent constructor should be module constructor');
  });
});

test('module.load() should be undefined', function () {
  (define)(__filename)
  (function () {
    var assert = require('assert');

    assert(typeof module.load === 'undefined');
  });
});

test('exports', function () {
  (define)(__filename)
  (function () {
    var assert = require('assert');

    assert(module.exports === exports, 'module.exports should be exports');
    assert(this === exports, 'exports should be this');
  });
});

test('no context leaks', function () {
  (define)(__filename)
  (function () {
    var assert = require('assert');

    assert(typeof id === 'undefined');
    assert(typeof context === 'undefined');
  });
});

test('returns module.exports', function () {

  var exported = (define)(__filename)
                  (function () {
                    'use strict';
                    module.exports = { id: 'exported' };
                  });
  
  assert(exported.id === 'exported');
});

test('does not return a "return" value', function () {
    
  var f = (define)(__filename)
          ('../fixture/c')
          (function () {
            'use strict';
            var assert = require('assert');
            
            assert(typeof c == 'function');
            return c;
          });

  assert(typeof f !== 'function');
});

test('intercept namespace define, then continue', function () {
  
  // intercept it from the initial statement
  var monad = (define)(__filename);
  
  assert(typeof monad === 'function');
  assert(monad.context.id === __filename);
  
  // continue using it
  var exports = (monad)
  (function() {
    exports.current = true;
  });
  
  assert(exports.current === true);
});

test('define filename not found', function () {

  assert.throws(function() {
    (define)('&8*(D');
  }, 'Cannot find module');
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
  
  assert(c('exported') === '[c]' + 'exported');
});

test('module.require()', function () {

  var c = (define)(__filename)
              (function () {
                'use strict';
                module.exports = module.require('../fixture/c');
              });
  
  assert(c('exported') === '[c]' + 'exported');
});

test('require.resolve', function () {

  var c = (define)(__filename)
              (function () {
                'use strict';
                module.exports = require.resolve('../fixture/c');
              });
  
  // tested on windows
  assert(c.replace(/\\/g, '/').indexOf('/fixture/c') !== -1);
});

test('require.cache', function () {

  (define)(__filename)
  ('../fixture/c')
  (function () {
  
    var assert = require('assert');
    
    var m = module.constructor._cache;
    var r = require.cache;
    var filename = module.constructor._resolveFilename('../fixture/c', module);
    
    assert(!!r && !!m && (m === r));
    assert(m[filename].exports === c);
    assert(r[filename].exports === c);
    
    delete r[filename];
    
    assert(r[filename] === undefined);
    assert(m[filename] === undefined);
  });
});

test('delete and re-require fixture', function() {

  (define)(__filename)
  ('../fixture/c')
  
  (function() {
    var assert = require('assert');
    var Module = require('module');
    var path = require.resolve('../fixture/c');
    
    assert(require.cache[path] != undefined);
    
    delete require.cache[path];
    assert(!require.cache[path]);

    assert(typeof require(path) == 'function');
  });
});


/* 
 * CYCLES SHOULD ALWAYS FAIL, BUT NODE.JS "FIXES" CYCLES WITH PROXY OBJECTS 
 * INSTEAD OF RETURNING THEIR EXPORTS. 
 * THAT IS REALLY TERRIBLE.
 */
suite('import cycles should always throw');

test('file cannot require itself', function() {

  assert.throws(function() {
    (define)(__filename)
    (__filename)
    (function () {
      throw new Error('should not execute');
    });
  }, 'file cannot require itself');
});

test('dependency cannot require itself', function() {

  assert.throws(function() {
    (define)(__filename)
    ('../fixture/self-cycle')
    (function () {
      throw new Error('should not execute');
    });
  }, 'dependency cannot require itself');
});

test('deep cycle throws', function() {

  (function(){
    (define)(__filename)
    ('../fixture/cycle')
    (function () {
      // cycle requires nested/cycle
      // nested/cycle requires cycle, 
      // and attaches 'nested' property to imported cycle
      throw new Error('should not execute');
    });
  }, 'deep cycle throws');
});


/*
 * various import and execution combinations
 */
suite('import paths');

test('node_modules', function () {
  (define)(__filename)
  ('assert')
  ('path')
  (function () {
    assert(path, 'should import node modules');
  });
});

test('monad requires common', function () {
  (define)(__filename)
  ('assert')
  ('../fixture/c')
  (function() {
    assert(c('test') === '[c]' + 'test');
  });
});

test('use strict', function () {

  (define)(__filename)
  ('assert')  
  ('../fixture/c')
  (function () {
    'use strict';
    assert(typeof c == 'function');
  });
});

test('multiple dependencies', function() {

  (define)(__filename)
  ('assert')
  ('../fixture/m')
  ('../fixture/c')
  (function () {
    assert(typeof m == 'function');
    assert(typeof c == 'function');
  });
  
  assert(typeof m == 'undefined');
  assert(typeof c == 'undefined');
});

test('windows path separator handled', function() {
  (define)(__filename)
  ('assert')  
  ('..\\fixture\\m')
  (function () {
    assert(typeof m == 'function');
  });
});

test('pass values by module properties', function() {

  (define)(__filename)
  ('assert')  
  
  (function () {
    module.hello = 'hello';    
  });
  
  (define)(__filename)
  (function () {
    assert(module.hello === 'hello');    
  });
});

test('pollute other modules by properties', function () {
  (define)(__filename)
  ('assert')  
  
  ('../fixture/c')
  (function () {
    c.hello = 'hello';    
  });
  
  (define)(__filename)
  ('assert')  
  
  ('../fixture/c')
  (function () {
    assert(module.exports !== c);
    assert(c.hello === 'hello');    
  });
});

test('monad requires monad', function () {
  (define)(__filename)
  ('assert')
  ('../fixture/m')
  (function() {
    assert(m('test') === '[m]' + 'test');
  });
});

test('monad requires nested monad', function () {
  (define)(__filename)
  ('assert')
  ('../fixture/m2m')
  (function() {
    assert(m2m('test') === '[m2m][m]' + 'test');
  });
});

test('common requires monad', function () {
  (define)(__filename)
  ('assert')
  ('../fixture/c2m')
  (function() {
    assert(c2m('test') === '[c2m][m]' + 'test');
  });
});

test('import ./hyphenated-test-module as hyphenatedTestModule', function() {
  (define)(__filename)
  ('assert')
  ('../fixture/hyphenated-test-module')
  (function () {
    assert(hyphenatedTestModule() === 'hyphenated');
  });
});

test('trim path whitespace', function () {
  (define)(__filename)
  ('assert')
  
  ('  ../fixture/m   ')
  (function () {
    assert(m('test') === '[m]' + 'test');
  });
});

test('support very relative pathnames', function () {

  (define)(__filename)
  ('assert')
  
  ('../../../test/mocha/fixture/c2m')
  (function() {
  
    assert(c2m('a') === '[c2m][m]' + 'a');
    
    // inner
    (define)
    ('../fixture/m')
    (function () {
      assert(c2m('b') === '[c2m][m]' + 'b');
      assert(m('bob') === '[m]' + 'bob');
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
  
    var assert = require('assert');
    
    var b = 'b';
    
    assert(typeof a === 'undefined');
    assert(c2m('a') === '[c2m][m]' + 'a');

    // inner define call on same context
    (define)
    (function() {
    
      assert(typeof a === 'undefined');
      assert(typeof b === 'undefined');
      
      assert(c2m('b') === '[c2m][m]' + 'b');
    });
  });
});

test('inner define with cycle', function () {

  assert.doesNotThrow(function(){
    (define)(__filename)
    (function() {
     
      // inner define on same filename should cycle but not throw
      var inner = (define)(__filename)
      (function () {
        module.exports = 'should cycle';
      });
    });
  }, 'should cycle but not throw');
});

test('inner context can require node_modules', function () {

  (define)(__filename)
  (function() {
  
    (define)
    ('assert')
    ('path')
    (function () {
      assert(path);
    });
  });
});

test('pass values to nested modules via module properties', function() {

  (define)(__filename)
  
  (function () {
    module.outer = 'hello';

    (define)
    (function () {
      require('assert')(module.outer === 'hello');    
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
    
    require('assert')(inner === 'whatever');
  });
  
  assert(exported === 'hello');
});

/*
 * varname, pathname and global aliases
 */
suite('aliasing');

test('nesting', function () {
  (define)(__filename)
  ('assert')
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  (function () {
    assert(c('test') === '[nested c]' + 'test');
    assert(m('test') === '[nested m]' + 'test');
  });
});

test('colliding', function () {
  (define)(__filename)
  ('assert')

  ('../fixture/m')
  ('../fixture/nested/m')
  (function () {
    assert(m('test') === '[nested m]' + 'test');
  });
});

test('aliasing', function () {
  (define)(__filename)
  ('assert')

  ('../fixture/m')
  ('m2 := ../fixture/nested/m')
  (function () {
    assert(m('test') === '[m]' + 'test');
    assert(m2('test') === '[nested m]' + 'test');
  });
});

test('path aliasing', function () {
  (define)(__filename)
  ('assert')
  
  ('../fixture/nested/m := ../fixture/nested/mock')
  (function () {
    assert(m('test') === '[nested mock]' + 'test');
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
  ('assert')

  ('{zuber} := ../fixture/zuber')
  (function () {
    assert(zuber('test') === '[global-zuber]' + 'test');
  });
});

test('trim alias whitespace', function () {
  (define)(__filename)
  ('assert')
  
  ('  fm :=  ../fixture/m   ')
  ('  ../fixture/nested/m    :=    ../fixture/nested/mock    ')
  (function () {
    assert(fm('test') === '[m]' + 'test');
    assert(m('test') === '[nested mock]' + 'test');
  });
});

// wrap suite - hence aliases - inside def
(define)(__filename)
('assert')

('m := ../fixture/m')
(function () {

  suite('wrapped suite');
  
  test('first', function () {
    assert(m);
  });
  
  test('second', function () {
    assert(m);
  });
  
  (define)
  (function () {
  
    suite('wrapped and nested suite');
    
    test('first', function () {
      assert(m);
    });
    
    test('second', function () {
      assert(m);
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
    
    assert(typeof after === 'function');
    assert(typeof module.load === 'undefined');

    module.exports = after();
  };
  
  var globals = { define: define, require: require };
  
  var result = sandbox(fn, context, globals);
  
  assert(result === 'after');
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
    assert(typeof after === 'function');
    assert(typeof later === 'function');
    
    module.exports = after() + later();
  };

  var result = define.exec(fn, monad);
  
  assert(result === 'after' + 'later');
});

test('with real dependencies', function () {

  (define)(__filename)
  ('assert')
  
  ('../fixture/nested/c')
  ('../fixture/nested/m')
  
  (function (m, c) {
  
    assert(c('test') === '[nested c]' + 'test');
    assert(m('test') === '[nested m]' + 'test');
  });
});

test('nested sandbox sees outer vars', function () {

  (define)(__filename)
  ('assert')

  ('../fixture/nested/c')
  ('../fixture/nested/m')
  
  (function (m, c) {
  
    assert(c('test') === '[nested c]' + 'test');
    
    var b = 'visible';
    
    (define)
    (function (m) {
      assert(m('test') === '[nested m]' + 'test');
      assert(b === 'visible');
    });
  });
});
