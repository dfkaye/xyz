// mocha/suite.js

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

test('import fake', function () {
  (define)
  ('./fake')
  (function () {
    fake.should.be.ok;
  });
});

test('use strict', function () {
  (define)
  ('./fake')
  (function () {
    'use strict';
    fake.should.be.ok;
  });
});

test('multiple deps, no leaks', function() {
  (define)
  ('fs')
  ('./fake')
  (function () {  
    fs.should.be.ok;
    fake.should.be.ok;
  });
});

test('no deps, no leaks', function() {
  (define) 
  (function () {  
    (typeof fs).should.be.equal('undefined');    
    module.filename.should.containEql('suite.js');
  });
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
          ('./fake')
          (function () {
            'use strict';
            fake.should.be.ok;
            return fake;
          });
  
  f.should.be.ok;
  
  // didn't leak?
  (typeof fake).should.be.equal('undefined');
  
});

test('require still works', function () {
  var fake = (define)
  (function () {
    'use strict';
    module.exports = require('./fake');
  });
  
  fake('exported').should.be.equal('exported');
});


test('complex nested module', function() {

  (define)
  ('./fake')
  ('should')
  ('fs')  
  (function () {
  
    // INNER NESTED SCOPE
    (define)
    ('fs')
    (function () {
      fs.should.be.ok;
      (typeof fake).should.be.equal('undefined');
    });
    
    // INNER SCOPE
    fake('id').should.be.equal('id');
    fs.should.be.ok;
    (typeof require).should.be.equal('function');
    
    // no leakage from exec
    (typeof fn).should.be.equal('undefined');
    (typeof context).should.be.equal('undefined');
    (typeof exec).should.be.equal('undefined');
    
    // this, exports, module.exports
    module.exports.should.be.equal(exports);
    this.should.be.equal(exports);
  });
  
  // OUTSIDE SCOPE
  (typeof fs).should.be.equal('undefined');
  (typeof fake).should.be.equal('undefined');
  
});

test('camelize hyphenated-test-module', function() {
  (define)
  ('fs')  
  ('./hyphenated-test-module')
  (function () {
    fs.should.be.ok;
    hyphenatedTestModule().should.be.equal('hyphenated');
  });
});

test('require.cache', function () {  
  (define)
  ('./fake')
  (function () {
  
    var m = module.constructor._cache;
    var r = require.cache;
    var filename = module.constructor._resolveFilename('./fake', module);
    
    (!!r && !!m && (m === r)).should.be.true;
    (m[filename].exports === fake).should.be.true;
    (r[filename].exports === fake).should.be.true;
    
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
    
    should.should.be.ok;
    should = undefined;

    // don't do this - it breaks all existing objects with should
    //delete Object.prototype.should;

    require('should');
    should.should.be.ok;
  });
});

test('define as ', function () {
  should.throws('not implemented');
});
