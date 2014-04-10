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
+ expected global (not a module.export) `'global.$ := path/to/jQuery'`
+ injection from outer to inner scope ~ mmmmm, maybe
+ browser version of this ~ 
+ rawgithub page
+ happy build/concat tool with tests  (use `task()` pattern)
+ acknowledgements & support
+ rename it
+ push to npm

## motivation

exorcising code demons that disturb sleep ~ https://gist.github.com/dfkaye/7390424

es6 imports is a huge disaster ~ the only people who could possibly favor it are 
unlikely to make their living working in __cross-browser__ JavaScript on a daily 
basis.

turns out the chaining pattern of jQuery is one way to do this ~ see 
[Labjs](http://labjs.com/documentation.php), for example ~ but that kind of 
chaining is more suited to BCE scripts (i.e., "(before CommonJS era").

the JavaScript dependency loading API should be monadic for better readability, 
scoping, nesting, leak prevention, composability, blah blah.

## node.js `require`

instead of 

    var a = require('a/path');
    var b = require('b/path');
    
    // now proceed with the rest of commonjs
    module.exports = function () {
    
    }
    
should be

    require('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });

That "could" work on the browser but `require` on node.js is pretty much locked 
down.  For node.js we'd have to wrap the module loading API with a different 
name, such as `define` which is used in&hellip;

## AMD

this is actually really really close (requirejs, seajs)

    define(function(module, require, exports) {
    
      var a = require('a/path');
      var b = require('b/path');
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }

      // etc.
    });

all we have to do is pull the dependency statements up, into a monadic pattern

    define('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // now proceed with the rest of commonjs
      module.exports = function () {
      
      }
      
      // etc.
    });

which collapses nicely to anonymous modules (node.js)

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

and named modules (assert on node, assign + assert on browser)
    
    (define.assert('./an/id/path')) // assert on node, assign + assert on browser
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

## it will just be better

we'd be able to run a concat of scripts written in this way without having to 
re-wrap and/or transform everything <i>a la</i> browserify or r.js.  

then we could get back to work solving our real issues.

## License

JSON (modified MIT)
