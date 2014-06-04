xyz
===

[![Build Status](https://travis-ci.org/dfkaye/xyz.png)](https://travis-ci.org/dfkaye/xyz)

"(insane)(parenthetical)(module)(pattern); // working name" 

## in progress

code still a bit untidy but working under tests
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

## motivation

needed to exorcise code demons that disturbed sleep ~ 
https://gist.github.com/dfkaye/7390424

ideas and implementations and refactorings keep coming up

## main idea

it's all about the syntax

but first&hellip;

## [dojo already did that](http://www.youtube.com/watch?v=BY0-AI1Sxy0)

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

## monadic chaining pattern

I'm advocating something more *monadic* where the `define()` function returns 
*itself* or another function which manages some other object internally. That's 
not really a *monad* - more like *currying* - and *memoizing* of search/load 
results.  It's a bit more declarative (though there's work behind the scenes and 
the order matters), making it more readable, IMO.

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

&hellip;
    
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
global config file business.


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

to do that, specify an alias and delimiter along with the path name:

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

*seems unexpected to have to specify that something is global ~ better to enable 
straight references and disambiguate collisions by aliasing vs. global.whatever*

or use an alias to avoid clobbering, e.g., `'{alias} := path/name'`

__this works but seems unnecessary__

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


## Content Security Policy

__in progress__

CSP headers allow clients to disable script evaluation by default, 
which means `Function()` can't be used, unless you declare 'unsafe-eval' in the 
CSP response header or meta tag directive. See 
https://developer.chrome.com/extensions/contentSecurityPolicy#relaxing-eval for 
more information.

If you're under this restriction, the solution in place here as of 2 JUNE 2014 
is to add the expected dependency aliases as parameter names in the callback 
function, *in any order*:

    (define)(__filename)
    
    ('./path/to/some-module')
    ('./path/to/dependency := ./path/to/mock')
    
    (function(dependency, someModule) { // <= params match aliases, any order
    
      someModule
      dependency //=> mock
    });

This could also be mitigated by a build process/nightmare eventually.


## it will just be better

we'd be able to run very minimal transformations on scripts written in this way. 
we can replace the `(define)(__filename)` statements in each node file with the 
file's app-relative pathname for use in the browser, we could concat the files 
in dependency order using the `define` capability built in, without having to 
re-wrap everything <i>&agrave; la</i> browserify or r.js, without having to 
transform everything <i>&agrave; la</i> traceur or es6ify, or any of the other 
trendy-but-wrong, might-as-well-be-coffeescript transpoilers&trade;.  

then we could be productive again on both browser and node.js and get back to 
work solving our real issues.


## License

JSON (modified MIT)
