## PROGRESS

as of 4 JUN --30,29,25,23,21,16 MAY 2014

+ [11 JUN] - finish converting should.js tests to assert();
+ [5 - 14 JUN] VACATION :)
+ [3 JUN 2014] slightly better path.normalize and Module._resolveFilename
+ [2, 3 JUN 2014] context security policy callback sandbox supported ~ but now 
    another idea regarding top-level or 'builtin' modules and prepubbing comes up
+ [29 MAY 2014] finished big refactor/merge of util and namespace methods on to 
    the global define method.
+ [19 MAY 2014] More internal refactoring to do as I've finally realized this is
    more properly a `curry`, not a `monad`
+ [19 MAY 2014] start adding proper error handling for browser requests
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
    issue resolved for alias case ~ demands a major refactoring to anticipate 
    the path_alias and global_alias cases
+ [9-10-11 APR 2014] node.js version "works" with mocha+should tests
