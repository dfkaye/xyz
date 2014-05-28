// ./script.js

//////////////////////////////////////////////////////
// script
// Module._load('script');
// Module._cache['script'].exports = script;

/*
 * api for dom script element requests 
 *
 *  ready, request, load, attach, & callback to request
 *
 * requires: main.parentNode, assert
 */
var script = {};

/*
 * are all deferred dependencies available?
 */
script.ready = function ready(fn, monad) {

  var p = script.pending && script.pending[monad.context.module.id];
  
  if (p && p.length > 0) {
  
    // memoize the fn so that exec() can get to it
    monad.fn || (monad.fn = fn);
    
  } else {
  
    // don't expose fn as a symbol to make()
    delete monad.fn;
  }
  
  return !monad.fn;
};

/*
 * fetch dependencies via htmlscriptelement
 * 
 */
script.request  = function require(request) {

  console.log('---------------script.request-----------------------');

  assert(request.filename, 'script.request: missing request.filename property');
  assert(request.forId, 'script.request: missing request.forId property');
  assert(request.onload, 'script.request: missing onload callback');
  
  var filename = request.filename;
  var id = request.forId;

  // script.pending is created only if script.request is called
  var pending = script.pending || (script.pending = []);
  
  pending[id] || (pending[id] = []);
  pending[id].push(request);
  
  script.load(request.filename, function callback(err) {
    script.pending[id].pop();
    request.onload(err, pending[id].length < 1);
  });
};

/*
 * new HTMLScriptElement
 */
script.attach = function attach(src, callback) {

  console.log('---------------script.attach-----------------------');
  
  // callback required - 
  assert(typeof callback == 'function', 'attach callback required');
  
  var s = document.createElement('script');

  s.onload = s.onreadystatechange = function (e) {   
    var rs = s.readyState;
    if (!rs || rs == 'loaded' || rs == 'complete') {
      s.onload = s.onreadystatechange = null;
      callback();
    }
  };
  
  /*
   * for more info about errors see
   * http://www.quirksmode.org/dom/events/error.html
   */
  s.onerror = function (e) {
    callback({ type: 'error', message: 'file not found:' + src });
  };

  s.src = src;
  
  //////////////////////////////////////////////
  // 
  // TODO: better declaration and handle for main and parentNode
  //
  //////////////////////////////////////////////
  main.parentNode.appendChild(s);  
  return s;
};

/*
 *  Steve Souders' ControlJS style of script caching
 */
script.load = function load(src, callback) {

  console.log('---------------script.load-----------------------');

  // callback required - 
  assert(typeof callback == 'function', 'script callback required');

  script.cache || (script.cache = {});
  
  (script.cache[src] && script.attach(src, callback)) || (function () {
    var img = new Image();
    
    /*
     * onerror is always executed by browsers that receive js text instead of 
     * the expected img type, so ignore that and delegate to attach() which will 
     * handle bad url errors.
     */
    img.onerror = img.onload = function (e) {
      script.attach(src, callback); 
    };
    
    img.src = src;
    script.cache[src] = img;
  }());
};
