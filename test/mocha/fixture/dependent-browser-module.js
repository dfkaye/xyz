// dependent-browser-module

(define)('../../../test/mocha/fixture/dependent-browser-module')

('bm := ./browser-module')

(function() {

  module.exports = dpm;
  function dpm(msg) {
    return '[dependent-browser-module]' + bm(msg);
  }
  
  //console.log(dpm('loaded'));
});