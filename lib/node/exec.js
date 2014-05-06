// exec

var assert = require('assert');

module.exports = exec;

/*
 * puts context entries into fn scope, calls new Function, returns result
 */
function exec(fn, context) {
  assert(arguments.length === 2, 'exec: requires fn and context arguments.');
  assert(typeof fn == 'function', 'exec: fn should be a function.');
  assert(context, 'exec: context is not defined.');
  assert(context.module, 'exec: module is not defined.');
  assert('exports' in context.module, 'exec: module.exports is not defined.');

  make(fn, context)(context); // or f = make(fn, context); f(context);
  return context.module.exports;
}

exec.make = make;

function make(fn, context) {
  assert(arguments.length === 2, 'make: requires fn and context arguments.');
  assert(typeof fn == 'function', 'make: fn should be a function.');
  assert(context, 'make: context is not defined.');
  assert(context.module, 'make: module is not defined.');
  assert('exports' in context.module, 'make: module.exports is not defined.');

  var code = '  "use strict";\r\n  ';
  var k, f;

  code = code + '/* ' + context.filename + ' */ \r\n  ';

  for (var k in context) {
    if (context.hasOwnProperty(k) && k !== 'id') {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';
  
  // remove load method which should only be used by environment loader
  code = code + 'module.load = undefined;\r\n  ';
  
  // prevent context leakage
  'context' in context || (code = code + 'context = undefined;\r\n  ');

  code = code + '\r\n  (' + fn.toString() + ').call(exports);\r\n  ' +
         'return module.exports;';

  return Function('context', code);
}