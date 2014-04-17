// exec

module.exports = exec;

/*
 * puts context entries into scope of function fn, 
 * calls new Function, 
 * returns context
 */
function exec(context, fn) {

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
  'exec' in context || (code = code + 'var exec = undefined;\r\n');  
  code = code + '\n;(' + fn.toString() + ').call(exports)' + ';\r\n  ';

  //console.log((Function('context', code)).toString());
  
  return (Function('context', code))(context);
  //return context;
}