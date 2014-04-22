// c2m

module.exports = c2m;
function c2m(msg) {
  return '[c2m]' + require('./m')(msg);
}