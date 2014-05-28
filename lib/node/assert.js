// './assert.js'
;(function () {
  if (!global.document) {
    return module.exports = require('assert');
  } else {
    return global.assert = function assert(ok, message) {
      ok || (function (msg) {
        throw new Error(msg);
      }(message));
    };
  }
}());
