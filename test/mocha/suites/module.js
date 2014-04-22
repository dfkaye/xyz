// mocha/module-test.js

/* 
 * TEST #1 
 * BY REQUIRING IN THIS ORDER WE VERIFY THAT should() isn't broken by define().
 */
require('../../../lib/node/define');
require('should');
/* TESTS START HERE */

suite('module');

test('exists', function () {
  should.should.be.ok
  define.should.be.Function
});