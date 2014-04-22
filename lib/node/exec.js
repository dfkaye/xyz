// exec

var assert = require('assert');

module.exports = exec;

/*
 * puts context entries into fn scope, calls new Function, returns result
 */
function exec(fn, namespace) {
  assert(arguments.length === 2, 'exec() requires function and context args.');
  assert(namespace.module, 'module is not defined');

  make(fn, namespace)(namespace); // or f = make(fn, namespace); f(namespace);
  return namespace.module.exports;
}

exec.make = make;

function make(fn, context) {
  assert(arguments.length === 2, 'exec.make() requires function and context args.');
  assert(fn && typeof fn == 'function', 'fn is not defined');
  assert(context && typeof context == 'object', 'context is not defined');
  assert(context.module && typeof context.module == 'object', 
         'module is not defined');
  assert('exports' in context.module, 'module.exports is not defined');

  var code = '  "use strict";\r\n  ';
  var k, f;

  code = code + '/* ' + context.filename + ' */ \r\n  ';

  for (var k in context) {
    if (context.hasOwnProperty(k) && k !== 'id') {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';

  // prevent context leakage
  'context' in context || (code = code + 'context = undefined;\r\n  ');

  code = code + '\r\n  (' + fn.toString() + ').call(exports);\r\n  ' +
         'return module.exports;';

  return Function('context', code);
}