// mocha/suite.js

/* 
 * TEST #1 
 * BY REQUIRING IN THIS ORDER WE VERIFY THAT should() isn't broken by define().
 */
require('../../lib/node/define');
require('should');

/* TESTS START HERE */

suite('define');

test('exists', function () {
  should.should.be.ok
  define.should.be.Function
});

test('assert param is string or function', function () {
  (function() {
    define({});
  }).should.throw('param must be string or function');
});

test('globals', function () {

  (define)
  (function () {
    module.should.be.ok;
    module.exports.should.be.ok;
    exports.should.be.ok;
    require.should.be.Function;
    module.require.should.be.Function;
    global.should.be.ok;
    __dirname.should.be.ok;
    __filename.should.be.ok;
  });
});

test('import ./abc as abc', function () {

  (define)
  ('./abc')
  (function () {
    abc.should.be.ok;
  });
});

test('import ./hyphenated-test-module as hyphenatedTestModule', function() {

  (define)
  ('./hyphenated-test-module')
  (function () {
    hyphenatedTestModule().should.be.equal('hyphenated');
  });
});

test('use strict', function () {

  (define)
  ('./abc')
  (function () {
    'use strict';
    abc.should.be.ok;
  });
});

test('multiple dependencies', function() {

  (define)
  ('fs') // notice we import the fs module
  ('./abc')
  (function () {  
    fs.should.be.ok;
    abc.should.be.ok;
  });
  
  (typeof fs).should.be.equal('undefined');
});

test('sandboxed', function() {

  var q = {};
  
  (define) 
  (function () {
  
    // INNER SCOPE DOES NOT SEE OUTSIDE VARS
    
    (typeof q).should.be.equal('undefined');    
  });
});

test('circular dependencies', function () {

  (define)
  ('./suite.js')
  (function () {
    suite.should.be.equal(global.suite);
    suite.should.not.be.equal(module.exports);
  });
});

test('pass values by module properties', function() {

  (define) 
  (function () {
    module.hello = 'hello';    
  });
  
  (define) 
  (function () {
    module.hello.should.be.equal('hello');    
  });
  
  // polluting other modules by properties
  
  (define)
  ('./abc')
  (function () {
    abc.hello = 'abc';    
  });
  
  (define)
  ('./abc')
  (function () {
    abc.hello.should.be.equal('abc');    
  });
  
  // names still protected
  
  (define)
  ('./nested/abc')
  (function () {
    (typeof abc.hello).should.be.equal('undefined');    
  });  
});

test('nested modules have own scope', function() {

  (define)
  ('./abc')
  ('should')
  ('fs') // notice we import the fs module
  (function () {
  
    abc('id').should.be.equal('id');
    fs.should.be.ok;
    (typeof require).should.be.equal('function');
    
    // no leakage from exec
    (typeof fn).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
    (typeof exec).should.be.equal('undefined');
    
    // this, exports, module.exports
    module.exports.should.be.equal(exports);
    this.should.be.equal(exports);
    
    fs = null;
    abc = null;
    
    (define)
    (function () {
    
      // 11 APR 2014 - NOT SURE THIS IS RIGHT...
      // INNER NESTED SCOPE WITH NO EXTRA IMPORTS SHOULD NOT SEE OUTSIDE IMPORTS
       
      (typeof fs).should.be.equal('undefined');
      (typeof abc).should.be.equal('undefined');       
      //fs.should.be.ok;
      //abc.should.be.ok;

    });

    (define)
    ('./abc')
    ('fs')   
    (function () {
    
      // INNER NESTED SCOPE WITH EXPLICIT IMPORTS
      
      fs.should.be.ok
      abc.should.be.ok
    });
    
    // FINALLY VERIFY NESTED INNER DOESN'T LEAK TO INNER...
    
    (!!fs).should.be.false;
    (!!abc).should.be.false;
  });
  
  // ...OR TO OUTSIDE SCOPE
  (typeof fs).should.be.equal('undefined');
  (typeof abc).should.be.equal('undefined');
  
});

test('returns module.exports', function () {

  var exported = (define)
                  (function () {
                    'use strict';
                    module.exports = { id: 'exported' };
                  });
  
  exported.id.should.be.equal('exported');
});

test('does not return a return value', function () {
  
  (f === undefined).should.be.true;
  
  var f = (define)
            ('./abc')
            (function () {
              'use strict';
              abc.should.be.Function;
              return abc;
            });

  f.should.not.be.Function;
});

/* NAMING TESTS */

suite('define.assert');

test('default filename', function () {

  (define)
  (function () {
    module.filename.should.containEql('suite.js');
  });
});

test('define.assert __filename', function () {

  (define).assert(__filename)
  ('path') // notice we import the path module
  (function() {  
    var id = ['suite.js'].join(path.sep);
    module.id.should.containEql(id);
  });
});

test('define.assert short filename', function () {

  // this works but probably should be avoided
  
  (define).assert('./suite.js')
  ('path') // notice we import the path module
  (function() {  
    var id = ['suite.js'].join(path.sep);
    module.id.should.containEql(id);
  });
});

test('define.assert relative filename', function () {

  // this works but probably should be avoided

  (define).assert('../../test/mocha/suite.js')
  ('path') // notice we import the path module
  (function() {  
    var id = ['test', 'mocha', 'suite.js'].join(path.sep);
    module.id.should.containEql(id);
  });
});

test('define.assert filename not found', function () {

  (function() {
    (define).assert('&8*(D');
  }).should.throw(/Cannot find module/);
});

test('define.assert cannot be called more than once', function () {

  (typeof define.assert(__filename).assert).should.be.equal('undefined');
});


/* REQUIRE() TESTS */

suite('require');

// 18 APR 2014
// AHA ! thanks to refactoring exec() with its own suite we've found some guard
// conditions breaking that apparently lead to leaks in the API...

test('"global" require()', function () {

  var abc = (define)
              (function () {
                'use strict';
                module.exports = require('./abc');
              });
  
  abc('exported').should.be.equal('exported');
});

test('module.require()', function () {

  var abc = (define)
              (function () {
                'use strict';
                
                console.log('------------------------------------------');
                module.exports = module.require('./nested/abc');
              });
  
  abc('exported').should.be.equal('nested exported');
});

test('AMD-like', function() {

  (define)
  (function () {
    var q = require('fs'); // node.js fs module
    var x = require('./abc');
    
    q.should.be.ok;
    x.should.be.ok;
  });
});

test('require.cache', function () {

  (define)
  ('./abc')
  (function () {
  
    var m = module.constructor._cache;
    var r = require.cache;
    var filename = module.constructor._resolveFilename('./abc', module);
    
    (!!r && !!m && (m === r)).should.be.true;
    (m[filename].exports === abc).should.be.true;
    (r[filename].exports === abc).should.be.true;
    
    delete r[filename];
    
    (r[filename] === undefined).should.be.true;
    (m[filename] === undefined).should.be.true;
  });
});

test('delete and re-require should.js', function() {

  (define)
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


/* MULTIPLE NAME AND ALIAS TESTS */

// should have done this first...
suite('requiring files that require files');

test('suite => def => abc', function () {

  (define).assert(__filename)
  ('./def')
  (function(){
    def('leppard').should.be.equal('defness for ' + 'leppard');
  });
});

test('name collision, last one in wins', function () {

  (define).assert(__filename)
  ('./def')
  ('./nested/def')
  (function(){
    def('leppard').should.be.equal('nested defness for nested leppard');
  });
});

test('prevent collisions with alias:=path', function () {

  (define).assert(__filename)
  ('defness:=./def')
  ('nesteddefness:=./nested/def')
  (function () {
    defness('test').should.be.equal('defness for test');
    nesteddefness('tested').should.be.equal('nested defness for nested tested');
  });
});