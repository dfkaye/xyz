// browser-module

(define)('./browser-module')
(function() {
  module.exports = mod;
  function mod(msg) {
    return '[browser-module]' + msg;
  }
});