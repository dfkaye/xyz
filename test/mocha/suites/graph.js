// graph test
var graph;

if (typeof require == 'function') {
  graph = require('../../../lib/node/graph');
  require('should');
}

var id = __filename.replace(/\\/g, '/');
var dep = './some/dep.js';
var dep2 = './some/dep2.js';

suite('graph');

test('add id', function () {
  graph.add(id).should.be.Array;
});

test('add dep', function () {
  (typeof graph.items[id][dep]).should.equal('undefined');
  graph.add(id, dep).length.should.equal(1);
  graph.items[id][dep].should.equal(dep);
  
});

test('add dep2 to dep', function () {
  graph.add(dep, dep2).length.should.equal(1);
});

test('resolve deps', function () {
  (function () {
    graph.resolve(id);
  }).should.not.throw();
});

test('detect cycle', function () {

  graph.add(dep2, id).length.should.equal(1);

  (function () {
    graph.resolve(id);
  }).should.throw();
});
