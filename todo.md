## TODO

as of 11 JUN -- 4 JUN, 30,29,25,23,21,16 MAY 2014

- use the util methods themselves to build the builds

- revisit nested defs - anon vs named
- revisit top-level unqualified names ("module" vs "./module")
  + dotmodules?  '.module-name' similar to '#name'
- revisit extensibility or reuse of given name vs draconian no-ext option

- revisit alias separator ("name := path/name" vs "path/name {as} name")
  + as `string.prototype.as = fn(alias) { return this.concat('{as}', alias; }`
  
- revisit global alias ({name} := path/name vs not supporting it)
- revisit or punt on deep aliasing for mocks (like rewire)

- better error handling
  + add namespace.error(fn(err){ show error and shut down});
  + let require throw
  + let graph throw
  
- add warning re double include paths; or just ignore??
- add better pre-registering modularize pattern <<< require.refresh() or sim?
- add better declaration and handle for main and parentNode

- externalize define.string() script.request() to a shorter block

- three-star comments for function body (won't work with csp no-eval)
- better build.js for the above
- webpagetest for the above

- verify legacy browsers (use webpagetest)

- gulp build with jshint, concat, uglify
- gulp-convert-common-to-xyz

- support script-reload (or get rid of img cache)

- happy build/concat tool with tests  (use `task()` pattern)
- acknowledgements & support
- rename it
- push to npm

- DONE CONVERT ALL SHOULD TESTS TO ASSERT
- DONE reduce string constants for normalize()
- DONE create 'path' module, put normalize there (do not move normalize into 
        Module._resolveFilename)
- DONE content-security-policy no-eval version of exec/make/sandbox
- DONE add string#trim polyfill in browser.js
- DONE remove should.js from browser tests
- DONE fix script request to take parent instead of forId
- DONE move namespace to define.namespace, make define the only global, and
        move namespace methods to define
- DONE (via namespace() member methods) 
        encapsulate related methods into units, then expose the units
- DONE move exec, string, and make to namespace.exec, namespace.string, 
            namespace.make
- DONE fix basepath on file:// protocol
- DONE put camelize on namespace.camelize
- DONE put graph on namespace.graph
- DONE expose namespace as define.namespace??
- DONE get rid of global state vars (main, scripts, script, etc.)
- DONE strategy pattern for implementations of needed methods
- DONE de-couple script.request from exec, use request.onload(err, done)
- DONE browser global.require - BUT MODULE MUST BE CACHEd, no remote request
- DONE add context member to monad (move keys from monad to context)
- DONE get rid of state vars (registry, stack)
- DONE move stack to exec.stack
- DONE move registry to define.cache
- DONE require() & module.require() (with tests)
- DONE normalize() on file:// protocol
- DONE zero in on the failed to load async deps properly (clobbering?)
  + localhost + testem
  + rawgithub
- DONE travis config
- DONE testem config
- DONE cycle detection ~ cycles are forbidden. period.
- DONE fix context init (facepalm 13 apr 2014) ~ nope. first intuition was 
    right ~ this api is *different* so need to make the mapping/loading rules 
    more clear ~ *[22 APR 2014] fixed with monadic pattern*
- DONE should nested `define()` see deps in outer scope? ~ deps and 
    properties only, not vars
- var alias ~ *debating*
  + `'x := path/to/something'` ~ *[17 APR 2014]*
  + <del>`'{x} := path/to/something'`</del>
- alias expected global (not a module.export) ~ *done but may pull this out*
  + <del>`'global.$ := path/to/jQuery'`</del>
  + `'{$} := path/to/jQuery'` ~ *[23 APR 2014]*
- path alias ~ *debating*
  + `'path/to/something := path/to/mock'` ~ *[22 APR 2014]*
- pick an alias separator ~ *debating (excessively)*
  + ` : `   // this makes sense but harder to isolate in urls (scheme,port,etc)
  + ` :- `  // prolog, kinda different
  + ` := `  // this makes more sense esp on urls
  + ` :: `  // scope resolution operator ~ already means lookup, not bind
  + ` -> `  // <- mmmmmm, no ~ too coffeescript-y
  + ` ? `   // unusual
  + ` ! `   // loader plugin syntax
  + ` !! `  // could do that
  + ` % `   // mmmmmm, no
  + ` @ `   // mmmmmm, no
  + ` & `   // mmmmmm, no
  + ` => `  // scala style: ~ `import java.io.{ File => JFile }` *seems* better
- DONE dep inclusion from outer to inner scope ~ *[22 APR 2014 ~ yes. fixed]*
- DONE handle over-the-wire requests based on protocol/scheme ~ browser only
- DONE browser version of this *once the node version is "locked" down enough*
- DONE __HANDLE BAD URL ERRORS__
- DONE Content Security Policy sandbox ~ DONE 6/2/2014
- DONE rawgithub page ~ __great example of loading with latency__
- DONE webpagetest ~ needs repeated updating though (perhaps a build script !)
