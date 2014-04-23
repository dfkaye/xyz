xyz
===

insane js module pattern (working name) so we can be productive again and 
ignore the trendy-but-wrong transpile-everything crowd. 

## in progress

+ [22 APR 2014] success! big rewrite using monadic pattern
+ [18 APR 2014] __STARTING OVER (sort of)__ ~ better component tests (already 
found a bug in exec()), and better model of the loading sequence and 
dependencies
+ [17 APR 2014] - var alias supported with `'x:=path/to/x'` ~ horrible caching 
issue resolved for alias case ~ demands a major refactoring to anticipate the 
path_alias and global_alias cases
+ [9-10-11 APR 2104] node.js version "works" with mocha+should tests

## motivation

exorcising code demons that disturb sleep ~ https://gist.github.com/dfkaye/7390424

## dojo already did that 

this used to be simple. 

    dojo.provide("my.module");

    dojo.require("dojo.io.script");

    // dojo.provide made sure that my.module was created as a JavaScript object,
    // so properties can be assigned to it:
    my.module.name = "my module";
    
but it was coupled to dojo itself.  then they ruined it

    define(['dojo/_base/kernel', 'dojo/io/script', 'dojo/_base/loader'], 
      function(dojo, ioScript){
        dojo.provide("my.module");

        // dojo.provide made sure that my.module was created as a JavaScript object,
        // so properties can be assigned to it:
        my.module.name = "my module";
      });
    
## es6 imports

es6 `imports` is a huge disaster ~ 
[https://gist.github.com/wycats/51c96e3adcdb3a68cbc3#comment-801392] ~ 
the only people who could possibly favor it are unlikely to make their living 
working in __cross-browser__ JavaScript on a daily basis.

## js dependency loading api via chaining pattern

the JavaScript dependency loading API should be more declarative, for better 
readability, scoping, nesting, leak prevention, composability, blah blah.

the chaining pattern of jQuery is one way to do this ~ see 
[Labjs](http://labjs.com/documentation.php), for example.

call that the `method chaining` pattern, which means returning the same *object* 
after each member method call on the object.

that kind of chaining is more suited to BCE scripts, i.e., "before CommonJS era"

`monadic chaining` - which term I coin here for the nonce - means returning the 
same *function*, bound to the same object internally.

a monadic api is more declarative, and IMO more readable.

## what do you mean?

some node.js modules out there use this pattern

    require('asyncModule')(arg1);

more rarely but still possible for a promise-like api

    require('asyncModule')(arg1)(arg2)(arg3);

that could be turned into a lisp-y pattern or sequence as

    (require)
    ('asyncModule')(arg1)(arg2)(arg3);

that's not too hard to read but it plays on our expectation of what `require` 
is doing.

I am advocating the monadic chaining pattern for describing the whole module, 
not merely for loading,

    (define)
      ('asyncModule')
      ('another-module')
      (function () {
        asyncModule(arg1)(arg2)(arg3);
        anotherModule('hi, module');
      });

which is how "common" js modules should have been done in the first place, but 
never mind.

## commonjs `require`

gives us

    var a = require('a/path');
    var b = require('b/path');
    
    // ...rest of commonjs, etc.
    module.exports = ...
    
should be

    require('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });

That "could" work on the browser but `require` on node.js is pretty much locked 
down.  For node.js we'd have to wrap the module loading API with a different 
name, such as `define` which is used in&hellip;

## AMD

__this is actually really really close__ (requirejs, seajs)

    define(function(module, require, exports) {
    
      var a = require('a/path');
      var b = require('b/path');
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });

that relies on the "magic" of `function.toString()` to parse out `require` 
statements ~ which at first seems "cool" but turns out really to be more 
wasteful indirection and fakery

all we have to do is pull the dependency statements up, into a monadic pattern

    define('a/path')('b/path')(function () {
    
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });

then stack each call (node.js), adding parentheses and whitespace for visual 
grouping

    (define)
    
    ('a:path')
    ('b:path')
    
    (function callback() {
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });

add a way to name modules by file (id on node, assign + id on browser)
    
    (define).id(__filename)
    
    ('a:path')
    ('b:path')
    
    (function callback() {
      console.log('a : ' + (!!a));
      console.log('b : ' + (!!b));
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });   

## what happened to callback param names?

they're "injected" as variables in the callback indirectly via a `Function()` 
call which writes out a new function object, including callback.toString().

as commonjs modules return an export rather than a name we have to alias them in 
an assignment like `var name = require('module-name');`  that api is, however, 
synchronous which means it doesn't play well in the asynchronous world of the 
browser.

## default aliases

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

    (define)
    
    ('./path/to/cool-module')
    ('alias := ./path/to/another/cool-module')  // := token denotes name alias
    
    (function() {
      coolModule
      alias
    });

## path aliases

__still being worked out__

for testing modules with mocks of their dependencies it makes sense to add 
configuration injection close to the actual use of the thing


    (define)
    
    ('./path/to/cool-module')
    ('./path/to/dependency := ./path/to/mock')  // := token denotes name alias
    
    (function() {
      coolModule
      dependency //=> mock
    });

## content security policy

__still being worked out__

CSP is the ES6 co-conspirator meant to make life better but which actually 
raises the barrier to understanding and productivity by exposing developers to 
more footguns and pitfalls.

that said, CSP headers allow clients to disable script evaluation by default, 
which means `Function()` can't be used.  

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
+ <del>should nested `define()` see deps in outer scope?</del> ~ deps and 
    properties only, not vars
+ travis config
+ testem config
+ var alias ~ *debating*
  - `'x := path/to/something'` ~ *[17 APR 2014] ~ USING X:=Y*
  - `'{x} := path/to/something'`
+ alias expected global (not a module.export) ~ *debating* 
  - `'global.$ := path/to/jQuery'`
  - `'{$} := path/to/jQuery'`  
+ path alias ~ *debating*
  - `'path/to/something := path/to/mock'`
+ <del>pick an alias separator ~ *debating (excessively)*
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
  - ` & `   // mmmmmm, no</del>
  
+ <del>injection from outer to inner scope ~ mmmmm, maybe</del> - No. SRP.

+ browser version of this ~ *once the node version is "locked" down enough*
+ content security policy ~ *workaround needed*
+ rawgithub page
+ happy build/concat tool with tests  (use `task()` pattern)
+ acknowledgements & support
+ rename it
+ push to npm