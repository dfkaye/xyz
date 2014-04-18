// exec

module.exports = exec;

/*
 * puts context entries into fn scope, calls new Function, returns result
 */
function exec(context, fn) {
  var f = exec.fn(context, fn);
  // console.log(f);
  return f(context);
}

exec.error = function (message) {
  throw new Error(message);
};

/*
 *
 *
 */
exec.fn = function(context, fn) {
  
  // stuff is required  
  (context && typeof context == 'object') || 
    exec.error('context is not defined');
    
  (context.module && typeof context.module == 'object') || 
    exec.error('module is not defined');
    
  ('exports' in context.module) || 
    exec.error('module.exports is not defined');
    
  (fn && typeof fn == 'function') || 
    exec.error('fn is not defined');
  
  // ok to go
  
  var code = '  "use strict";\r\n  ';
  var  k, f;
  
  code = code + '/* ' + context.filename + ' */ \r\n  ';
  
  for (var k in context) {
    if (context.hasOwnProperty(k)) {
      code = code + 'var ' + k + ' = context[\'' + k + '\'];\r\n  ';
    }
  }

  code = code + 'var exports = module.exports;\r\n  ';
  
  // prevent context leakage
  'context' in context || (code = code + 'var context = undefined;\r\n  ');
  
  code = code + '\r\n  (' + fn.toString() + 
         ').call(exports);\r\n  return module.exports;';
  
  return Function('context', code);
}