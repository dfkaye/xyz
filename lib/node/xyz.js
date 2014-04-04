
var Module = require('module');

// https://github.com/fluidsonic/poison/blob/master/lib/poison.js
//function hijackModuleLoader() {

  var originalLoad = Module._load;
  var originalPrototypeLoad = Module.prototype.load;
  var requestStack = [];

  Module._load = function poisoned_Module__load(request) {  
    requestStack.push(request);
    try {
      return originalLoad.apply(this, arguments);
    }
    finally {
      requestStack.pop();
    }
  };

  Module.prototype.load = function poisoned_Module_prototype_load() {
 
    var mod = this;

    var request = requestStack[requestStack.length - 1];
    //mod.request = request;

  console.log(request);
    
    originalPrototypeLoad.apply(mod, arguments);

    // if (!isNamedModuleId(request)) {
    
      // console.log('not named: ' + request)
      // return;
    // }

    // var hooks = _hooks[request];
    // if (!hooks) {
      // return;
    // }

    // hooks.forEach(function(hook) {
      // hook(request, mod);
    // });
  };
//}


// function isNamedModuleId(moduleId) {
  // return (typeof moduleId === 'string' && !moduleId.match(/^\.|^[a-zA-Z]:|[/\\]/));
// }