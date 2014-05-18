xyz
===

"(insane)(parenthetical)(module)(pattern); // working name" 

so we can be productive again on both browser and node.js, and ignore the 
trendy-but-wrong transpile-everything crowd. 

[![Build Status](https://travis-ci.org/dfkaye/xyz.png)](https://travis-ci.org/dfkaye/xyz)

## in progress

Code is still a little messy but working under tests
  + see 
    <a href='https://rawgit.com/dfkaye/xyz/master/test/mocha/browser-suite.html' 
       target='_blank'>
      rawgithub browser-suite
    </a>
  + and 
    <a href='http://www.webpagetest.org/result/140512_5T_WX3/'
       target='_blank'>
      webpagetest browser-suite
    </a>

Probably some race conditions or long-delayed load events causing the occasional
hiccough in browser remote script requests.
    
+ [17 MAY 2014] fix normalize/resolve to support file:// protocol and rawgithub. 
+ [15 MAY 2014] browser loadscript finally working ~ lots of normalize/resolve problems.
+ [12 MAY 2014] ! browser version underway ! __more to iron out__ 
+ [9 MAY 2104] ! remove define.id(filename), just use define(filename) !
+ [8 MAY 2104] make exec() local, make make() its own module
+ [6 MAY 2104] ! collapse namespace into monad !
+ [5 MAY 2014] require.resolve and self.module.require update
+ [1 MAY 2014] super simple circular dependency detection added
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


## tl;dr 

it's all about the syntax, and 
__[dojo already did that](http://www.youtube.com/watch?v=BY0-AI1Sxy0)__

this used to be simple. 

    dojo.provide("my.module");

    dojo.require("dojo.io.script");

    // dojo.provide made sure that my.module was created as a JavaScript object,
    // so properties can be assigned to it:
    my.module.name = "my module";
    
however:

1) it was coupled to dojo itself (same with YUI, curl, google closure, et al), 

2) they ruined it with AMD

      define(['dojo/_base/kernel', 'dojo/io/script', 'dojo/_base/loader'], 
        function(dojo, ioScript){
          dojo.provide("my.module");
        
          // dojo.provide made sure that my.module was created as a JavaScript object,
          // so properties can be assigned to it:
          my.module.name = "my module";
        });
    
    
## es6 imports

es6 `imports` means this =>  
[https://gist.github.com/wycats/51c96e3adcdb3a68cbc3#comment-801392] ~ 
the only people who could possibly favor it are unlikely to make their living 
working in __cross-browser__ JavaScript on a daily basis.

## js dependency loading api via chaining pattern

the chaining pattern of jQuery is one way to do this ~ see 
[Labjs](http://labjs.com/documentation.php), for example.

call that the `method chaining` pattern, which means returning the same *object* 
after each member method call on the object.

that kind of chaining is more suited to BCE scripts, i.e., "before CommonJS era"

`monadic chaining` - which term I coin here for the nonce - means returning the 
same *function*, which manages some other object internally. that's not really a 
monad, but it's not quite currying either as it memoizes search/load results, 
and it's not purely declarative (there's work behind the scenes and the order 
matters), which means it looks like a stream but isn't really that either.

it is, however, more readable, IMO.


## what do you mean?

instead of commonjs `require`

    var asyncModule = require('asyncModule')
    var anotherModule = require('another-module')
        
    asyncModule(arg1)(arg2)(arg3);
    anotherModule('hi, module');

or AMD of the function parsing type ~ __which is actually really really close__ 
(see requirejs, seajs), but relies on the "magic" of `function.toString()` to 
parse out `require` statements ~ which at first seems "cool" but turns out 
really to be more wasteful indirection and fakery

    define(__filename, function(module, require, exports) {
    
      var a = require('a/path');
      var b = require('b/path');
      
      // ...rest of commonjs, etc.
      module.exports = ...
    });

# instead of all that

I am advocating a chaining pattern for describing the whole module, not merely 
for loading, by pulling the dependency statements up and skipping the extra 
`require` statement

    (define)(__filename)
    
    ('asyncModule')
    ('another-module')
    
    (function () {
    
      asyncModule(arg1)(arg2)(arg3);
      anotherModule('hi, module');
      
    });

Each dependency is declared in a single statement, removing the need for commas 
in a list.

Think of it as *"configuration injection"* at the module level that avoids the
global config file anti-pattern.

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

    (define)(__filename)
  
    ('./path/to/cool-module')
    
    (function() {
      coolModule
    });
    
    
## var aliases

if more than one file is named `'cool-module'`, we need a way to avoid the name 
clash on `coolModule` that would result.

    (define)(__filename)
    
    ('./path/to/cool-module')
    ('alias := ./path/to/another/cool-module')  // := token denotes name alias
    
    (function() {
      coolModule
      alias
    });

    
## global aliases

__*re-thinking this one*__

if a file sets a global value rather than returning an export, you can detect it 
from the `global` scope:

    (define)(__filename)
    
    ('../fixture/zuber')
    
    (function () {  
      global.zuber('test').should.be.equal('[global-zuber]' + 'test');
    });

or use an alias to avoid clobbering, e.g., `'{alias} := path/name'`

__that works but seems unnecessary__

    (define)(__filename)
    
    ('{zuber}:=../fixture/zuber')
    
    (function () {  
      zuber('test').should.be.equal('[global-zuber]' + 'test');
    });


## path aliases

__*re-thinking this one*__: *order may be confusing*

for testing modules with mocks of their dependencies it makes sense to add 
configuration injection close to the actual use of the thing

    (define)(__filename)
    
    ('./path/to/cool-module')
    ('./path/to/dependency := ./path/to/mock')  // := token denotes name alias
    
    (function() {
      coolModule
      dependency //=> mock
    });

    
## deep aliasing

__*still being worked out*__

this means we force all downstream dependencies to load an aliased path.

__*I am not sure that's wise*__ (though helpful for testing/mocking) as it moves 
the configuration out of local modules back to more global modules.


## content security policy

__*still being worked out*__

CSP is a ES6 co-conspirator meant to make life better but actually raises one 
more barrier to understanding and productivity by exposing developers to more 
footguns and pitfalls.

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

+ <del>travis config</del>
+ <del>testem config</del>
+ <del>cycle detection</del> ~ cycles are forbidden. period.
+ <del>fix context init (facepalm 13 apr 2014)</del> ~ nope. first intuition was 
    right ~ this api is *different* so need to make the mapping/loading rules 
    more clear ~ *[22 APR 2014] fixed with monadic pattern*
+ <del>should nested `define()` see deps in outer scope?</del> ~ deps and 
    properties only, not vars
+ var alias ~ *debating*
  - `'x := path/to/something'` ~ *[17 APR 2014]*
  - <del>`'{x} := path/to/something'`</del>
+ alias expected global (not a module.export) ~ *done but may pull this out*
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
  - ` => `  // scala style: ~ `import java.io.{ File => JFile }` *seems* better
+ <del>
  dep inclusion from outer to inner scope
  </del> ~ *[22 APR 2014 ~ yes. fixed]*
+ <del>
  handle over-the-wire requests based on protocol + scheme, etc.
  </del> ~ browser only, __in progress__
+ <del>
  browser version of this ~ *once the node version is "locked" down enough*
  </del> ~ __in progress__
+ content security policy ~ *workaround needed*
+ <del>rawgithub page</del> ~ __great example of loading with latency__
+ <del>webpagetest</del>
+ happy build/concat tool with tests  (use `task()` pattern)
+ acknowledgements & support
+ rename it
+ push to npm