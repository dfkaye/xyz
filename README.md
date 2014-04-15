xyz
===

insane js module pattern (working name)

## in progress

[14 APR 2014] - starting over ~ needs better context init logic

[9-10-11 APR 2104] node.js version "works" with mocha+should tests


## motivation

exorcising code demons that disturb sleep ~ https://gist.github.com/dfkaye/7390424

es6 imports is a huge disaster ~ the only people who could possibly favor it are 
unlikely to make their living working in __cross-browser__ JavaScript on a daily 
basis.

turns out the chaining pattern of jQuery is one way to do this ~ see 
[Labjs](http://labjs.com/documentation.php), for example ~ but that kind of 
chaining is more suited to BCE scripts ~ i.e., "before CommonJS era".

## monadic chaining vs object chaining

jQuery chaining means returning the same object after each member method call on 
the object.

monadic chaining means returning the same *function*

the JavaScript dependency loading API should be monadic for better readability, 
scoping, nesting, leak prevention, composability, blah blah.

some modules out there use this pattern

    require('asyncModule')(arg1);

more rarely but still possible for a promise-like api

    require('asyncModule')(arg1)(arg2)(arg3);

that could be turned into a lisp-y pattern as

    (require)
    ('asyncModule')(arg1)(arg2)(arg3);

which I'm advocating with this library as

    (define).assert(__filename)
    ('asyncModule')
    (function () {
      asyncModule(arg1)(arg2)(arg3);
    });
    
## commonjs `require`

gives us

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

then stack each call (node.js)

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

add a way to name modules by file (assert on node, assign + assert on browser)
    
    (define.assert(__filename))
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

## what happened to callback param names?

they're "injected" as variables in the callback indirectly via a `Function()` 
call which writes out a new function object, including callback.toString().

as commonjs modules return an export rather than a name we have to alias them in 
an assignment like `var name = require('module-name');`  that api is, however, 
synchronous which means it doesn't play well in the asynchronous world of the 
browser.

a required dependency that exports something is assigned to an alias derived 
from the filename.  An export defined in a file referenced at 
`'./path/to/cool-module.js'` will be assigned to a camelCased variable named 
`coolModule`.

    (define)
    ('./path/to/cool-module')
    (function() {
      coolModule
    });
    
## var aliases

if more than one file is named `'cool-module'`, we need a way to avoid the name 
clash on `coolModule` that would result.

__still being worked out__

    (define)
    ('./path/to/cool-module')
    ('alias := ./path/to/another/cool-module')  // := token denotes name alias
    
    (function() {
      coolModule
      alias
    });

## path aliases

for testing modules with mocks of their dependencies it makes sense to add 
configuration injection close to the actual use of the thing

__still being worked out__

    (define)
    ('./path/to/cool-module')
    ('./path/to/dependency := ./path/to/mock')  // := token denotes name alias
    
    (function() {
      coolModule
      dependency //=> mock
    });

## content security policy

csp headers allow clients to disable script evaluation by default, which means 
`Function()` can't be used.  

__still being worked out__

this could be mitigated by a build process/nightmare

## it will just be better

we'd be able to run a concat of scripts written in this way without having to 
re-wrap and/or transform everything <i>&agrave; la</i> browserify or r.js or 
traceur or es6ify or any of the other trendy-but-wrong, 
might-as-well-be-coffeescript transpoilers&trade;.  

then we could get back to work solving our real issues.

## License

JSON (modified MIT)



## TODO

+ <del>fix context init (facepalm 13 apr 2014)</del> ~ nope. first intuition was 
    right ~ this api is *different* so need to make the mapping/loading rules 
    more clear
+ should nested `define()` see deps in outer scope? ~ *debating*
+ travis config
+ testem config
+ var alias ~ *debating*
  - `'x := path/to/something'`
  - `'{x} := path/to/something'`
+ path alias ~ *debating*
  - `'path/to/something := path/to/mock'`
+ alias expected global (not a module.export) ~ *debating* 
  - `'global.$ := path/to/jQuery'`
  - `'{$} := path/to/jQuery'`
+ pick an alias separator ~ *debating (excessively)*
  - ` : `   // this makes sense but harder to isolate in urls (scheme,port,etc)
  - ` :- `  // prolog, kinda different
  - ` := `  // this makes more sense esp on urls
  - ` :: `  // scope resolution operator ~ already means lookup, not bind
  - ` -> `  // <- mmmmmm, no ~ too coffeescript-y
  - ` ? `   // unusual
  - ` ! `   // loader plugin syntax
  - ` !! `  // could do that
  - ` % `   // mmmmmm, no
  - ` @ `   // mmmmmm, no
  - ` & `   // mmmmmm, no
+ <del>injection from outer to inner scope ~ mmmmm, maybe</del> - No. SRP.
+ browser version of this ~ *once the node version is "locked" down enough*
+ content security policy ~ *workaround needed* ~ CSP is an ES6 co-conspirator
+ rawgithub page
+ happy build/concat tool with tests  (use `task()` pattern)
+ acknowledgements & support
+ rename it
+ push to npm