xyz
===

insane js module pattern (working name) so we can be productive again on both 
browser and node.js, and ignore the trendy-but-wrong transpile-everything crowd. 

## in progress

+ [1 MAY 2014] circular dependency detection added
+ [23 - 27 APR] VACATION :)
+ [22 APR 2014] SUCCESS! big rewrite using monadic pattern
+ [18 APR 2014] __STARTING OVER (sort of)__ ~ better component tests (already 
found a bug in exec()), and better model of the loading sequence and 
dependencies
+ [17 APR 2014] - var alias supported with `'x:=path/to/x'` ~ horrible caching 
issue resolved for alias case ~ demands a major refactoring to anticipate the 
path_alias and global_alias cases
+ [9-10-11 APR 2014] node.js version "works" with mocha+should tests

## motivation

exorcise code demons that disturb sleep ~ https://gist.github.com/dfkaye/7390424

## dojo already did that 

this used to be simple. 

    dojo.provide("my.module");

    dojo.require("dojo.io.script");

    // dojo.provide made sure that my.module was created as a JavaScript object,
    // so properties can be assigned to it:
    my.module.name = "my module";
    
but 

+ it was coupled to dojo itself (same with YUI, curl, google closure, et al).  
+ they ruined it with AMD

    define(['dojo/_base/kernel', 'dojo/io/script', 'dojo/_base/loader'], 
      function(dojo, ioScript){
        dojo.provide("my.module");

        // dojo.provide made sure that my.module was created as a JavaScript object,
        // so properties can be assigned to it:
        my.module.name = "my module";
      });
    
## es6 imports

es6 `imports` means this ~ 
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

instead of commonjs `require`

    var asyncModule = require('asyncModule')
    var anotherModule = require('another-module')
        
    asyncModule(arg1)(arg2)(arg3);
    anotherModule('hi, module');

or AMD __which is actually really really close__ (requirejs, seajs), 
but relies on the "magic" of `function.toString()` to parse out `require` 
statements ~ which at first seems "cool" but turns out really to be more 
wasteful indirection and fakery

    define(__filename, function(module, require, exports) {
    
      var a = require('a/path');
      var b = require('b/path');
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });

I am advocating the monadic chaining pattern for describing the whole module, 
not merely for loading, by pulling the dependency statements up and skipping the 
extra `require` statement

    (define).id(__filename)
    
    ('asyncModule')
    ('another-module')
    
    (function () {
    
      asyncModule(arg1)(arg2)(arg3);
      anotherModule('hi, module');
      
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

## global aliases

__on the fence__

if a file sets a global value rather than returning an export, you can detect it 
from the `global` scope:

    (define).id(__filename)
    ('../fixture/zuber')
    (function () {  
      global.zuber('test').should.be.equal('[global-zuber]' + 'test');
    });

or use an alias to avoid clobbering, e.g., `'{alias} := path/name'`

    (define).id(__filename)
    ('{zuber}:=../fixture/zuber')
    (function () {  
      zuber('test').should.be.equal('[global-zuber]' + 'test');
    });

## path aliases

for testing modules with mocks of their dependencies it makes sense to add 
configuration injection close to the actual use of the thing

    (define)
    
    ('./path/to/cool-module')
    ('./path/to/dependency := ./path/to/mock')  // := token denotes name alias
    
    (function() {
      coolModule
      dependency //=> mock
    });

## deep aliasing

__still being worked out__

this means force all downstream dependencies to load an aliased path.

## content security policy

__still being worked out__

CSP is the ES6 co-conspirator meant to make life better but which actually 
raises the barrier to understanding and productivity by exposing developers to 
more footguns and pitfalls.

that said, CSP headers allow clients to disable script evaluation by default, 
which means `Function()` can't be used.  

this could be mitigated by a build process/nightmare and/or using `iframes` for 
loading. maybe.

## it will just be better

we'd be able to run a concat of scripts written in this way without having to 
re-wrap and/or transform everything <i>&agrave; la</i> browserify or r.js or 
traceur or es6ify or any of the other trendy-but-wrong, 
might-as-well-be-coffeescript transpoilers&trade;.  

then we could get back to work solving our real issues.

## License

JSON (modified MIT)



## TODO

+ travis config
+ testem config
+ <del>cycle detection</del> ~ node.js cycle handling keeps the server up but 
    cycles left unattended mean bad habits ~ could put it in a build tool 
    instead&hellip;
+ <del>fix context init (facepalm 13 apr 2014)</del> ~ nope. first intuition was 
    right ~ this api is *different* so need to make the mapping/loading rules 
    more clear ~ *[22 APR 2014] fixed with monadic pattern*
+ <del>should nested `define()` see deps in outer scope?</del> ~ deps and 
    properties only, not vars
+ var alias ~ *debating*
  - `'x := path/to/something'` ~ *[17 APR 2014]*
  - <del>`'{x} := path/to/something'`</del>
+ alias expected global (not a module.export) ~ <del>*debating* </del>
  - <del>`'global.$ := path/to/jQuery'`</del>
  - `'{$} := path/to/jQuery'` ~ *[23 APR 2014]*
+ path alias ~ *debating*
  - `'path/to/something := path/to/mock'` ~ *[22 APR 2014]*
+ <del>pick an alias separator ~ *debating (excessively)*</del>
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
+ dep inclusion from outer to inner scope ~ *[22 APR 2014 ~ yes. fixed]*
+ handle over-the-wire requests based on protocol + scheme, etc.
+ browser version of this ~ *once the node version is "locked" down enough*
+ content security policy ~ *workaround needed*
+ rawgithub page
+ happy build/concat tool with tests  (use `task()` pattern)
+ acknowledgements & support
+ rename it
+ push to npm