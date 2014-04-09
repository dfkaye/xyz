xyz
===

insane js module pattern (working name)

## in progress

[9 APR 2104] node.js version "works" with mocha+should tests

## TODO

+ travis config
+ testem config
+ var alias  `'x := path/to/something'`
+ path alias `'path/to/something := path/to/mock'`
+ global alias `'$ := path/to/jQuery'`
+ injection from outer to inner scope
+ browser version of this
+ rawgithub page
+ happy build/concat tool with tests
+ rename it, push to npm

## motivation

exorcising code demons that disturb sleep ~ https://gist.github.com/dfkaye/7390424

`require` should be monadic.

instead of 

    var a = require('a/path');
    var b = require('b/path');
    
    // now proceed with the rest of commonjs
    module.exports = function () {
    
    }
      
or 

    // this is actually really close
    define(function(module, require, exports) {
      var a = require('a/path');
      var b = require('b/path');
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }

      // etc.
    });
    
should be

    require('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });

but since `require` on node.js is pretty solid we can use `define` instead

    define('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });

which collapses nicely to

+ anonymous module - node.js

    (define)
    ('a:path')
    ('b:path')
    (function callback() {
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });

+ named module - mainly for browsers - build tool can insert .as() etc.

    (define.as('an/id/path'))
    ('a:path')
    ('b:path')
    (function callback() {
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });   

## License

JSON (modified MIT)
