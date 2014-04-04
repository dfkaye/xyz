xyz
===

insane js module pattern (working name)

## motivation

exorcising code demons that disturb sleep.

`require` should be monadic.

instead of 

    var a = require('a/path');
    var b = require('b/path');
    
should be

    require('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });

+ anonymous module - node.js

    (require)
    ('a:path')
    ('b:path')
    ('c:path')
    ('d:path')
    (function callback() {

    });

+ named module - mainly for browsers - build tool can insert .define() etc.

    (require.define('an/id/path'))
    ('a:path')
    ('b:path')
    ('c:path')
    ('d:path')
    (function callback() {

    });

+ tool inserts define('an/id/path') before require stack

    define('an/id/path')
    (require)
    ('a:path')
    ('b:path')
    ('c:path')
    ('d:path')
    (function callback() {

    });

+ tool replaces (require) with (define('an/id/path'))

    (define('an/id/path'))
    ('a:path')
    ('b:path')
    ('c:path')
    ('d:path')
    (function callback() {

    });
    
