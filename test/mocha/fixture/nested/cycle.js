// nested/cycle
(define)(__filename)
('../cycle')
(function() {

  cycle.nested = true;
  
  module.exports = cycle;
});