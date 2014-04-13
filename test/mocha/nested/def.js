// nested/test module
(define).assert('./nested/def')
('./nested/fake')
(function() {

  module.exports = def;
  function def(id) {
    return 'nested defness for ' + fake(id);
  }
});