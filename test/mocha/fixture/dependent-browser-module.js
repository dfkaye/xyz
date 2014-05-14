// dependent-browser-module

(define)('./dependent-browser-module')
('bm := ./browser-module')
(function() {
  module.exports = dpm;
  function dpm(msg) {
    return '[dependent-browser-module]' + bm(msg);
  }
});