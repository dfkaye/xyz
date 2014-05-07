// alias learning test

////////////////////////////////////////////////////////////////////////////////
//
// LEARNING TESTS ABOUT ALIAS STORAGE & RE-USE ON GRAPH
//
////////////////////////////////////////////////////////////////////////////////

var graph, as;

if (typeof require == 'function') {
  graph = require('../../../lib/node/graph')();  // tricky init
  as = graph.as;
  require('should');
}

var id = __filename.replace(/\\/g, '/');
var alias = './some/alias.js';
var alias2 = './some/alias2.js';

suite('graph-alias');

test('as(id, alias)', function () {
  as(id, alias).id.should.be.equal(id);
  as[alias].id.should.be.equal(id);
});

test('as(id, alias2)', function () {
  as(id, alias2).id.should.be.equal(id);
  as[alias2].id.should.be.equal(id);
});

test('nondestructive as(alias, alias2)', function () {
  as(alias, alias2).id.should.not.be.equal(alias);
  as[alias2].id.should.not.be.equal(alias);
});

test('destructive as(alias, alias2)', function () {
  delete as[alias2];
  as(alias, alias2).id.should.be.equal(alias);
  as[alias2].id.should.be.equal(alias);
});