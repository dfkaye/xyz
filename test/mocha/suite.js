// mocha/suite.js

// in this order we verify that should() isn't broken by define()
require('../../lib/node/define');
require('should');

////////////////////////////////////////////////////////////////////////////////
//
// REAL TESTS START HERE
//
////////////////////////////////////////////////////////////////////////////////

suite('define');

test('exists', function () {
  should.should.be.ok
  define.should.be.Function
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

test('multiple deps, no leaks', function() {
  (define)
  ('fs') // notice we import the fs module
  ('./abc')
  (function () {  
    fs.should.be.ok;
    abc.should.be.ok;
  });
  
  (typeof fs).should.be.equal('undefined');
});

test('no deps, no leaks', function() {
  var q = {};
  (define) 
  (function () {
    // INNER SCOPE DOES NOT SEE OUTSIDE VARS
    (typeof q).should.be.equal('undefined');    
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
    
    // INNER NESTED SCOPE WITH NO ADDITIONAL IMPORTS
    (define)
    (function () {
    
      /*
       * 11 APR 2014
       * I THINK THIS IS A MISTAKE
       * INNER NESTED SCOPE PROBABLY SHOULDN'T SEE IMPORTS FROM OUTER CONTEXT
       */
    
      // INNER NESTED SCOPE SEES OUTSIDE IMPORTS
      fs.should.be.ok;
      abc.should.be.ok;
    });

    (!!fs).should.be.false;
    (!!abc).should.be.false;
  });
  
  // OUTSIDE SCOPE
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

test('return an import', function () {
  
  (f === undefined).should.be.true;
  
  var f = (define)
            ('./abc')
            (function () {
              'use strict';
              abc.should.be.ok;
              return abc;
            });
  
  f.should.be.ok;
  
  // didn't leak?
  (typeof abc).should.be.equal('undefined');
  
});

suite('require');

test('still works', function () {
  var abc = (define)
              (function () {
                'use strict';
                module.exports = require('./abc');
              });
  
  abc('exported').should.be.equal('exported');
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

test('delete and re-require should', function() {
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


suite('define.assert');

test('define.assert filename', function () {
  (define).assert('./suite.js')
  ('path') // notice we import the path module
  (function() {  
    var id = ['suite.js'].join(path.sep);
    module.id.should.containEql(id);
  });
});

test('define.assert relative filename', function () {
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
  (typeof define.assert('./suite.js').assert).should.be.equal('undefined');
});


// should have been first...
suite('import another file that imports another file');

test('suite => def => abc', function () {
  (define)//.assert(__filename)
  ('./def')
  (function(){
    def('leppard').should.be.equal('defness for ' + 'leppard');
  });
});

//nested/ name clash or clobbering?
test('suite => def + nested/def', function () {
  (define)//.assert(__filename)
  ('./def')
  ('./nested/def')
  (function(){
    def('leppard').should.be.equal('nested defness for nested leppard');
  });
});