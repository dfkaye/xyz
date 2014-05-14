// browser-module

(define)('../../../test/mocha/fixture/browser-module')
(function() {

  module.exports = mod;
  function mod(msg) {
    return '[browser-module]' + msg;
  }
  console.log(mod('loaded'));
  
});