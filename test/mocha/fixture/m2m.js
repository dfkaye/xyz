// m2m

(define)(__filename)
('./m')
(function() {
console.log('fixture/m2m loaded as ' + __filename);

  module.exports = m2m;
  function m2m(msg) {
    return '[m2m]' + m(msg);
  }
});