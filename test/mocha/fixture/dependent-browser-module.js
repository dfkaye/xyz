// dependent-browser-module

(define)('../../../test/mocha/fixture/dependent-browser-module')

('./browser-module {as} bm')

(function() {

  module.exports = dpm;
  function dpm(msg) {
    return '[dependent-browser-module]' + bm(msg);
  }
  
});