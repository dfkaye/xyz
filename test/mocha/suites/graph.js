// graph test
var graph;

if (typeof require == 'function') {
  graph = require('../../../lib/node/graph')();  // tricky init
  require('should');
}

var id = __filename.replace(/\\/g, '/');
var dep = './some/dep.js';
var dep2 = './some/dep2.js';

suite('graph');

test('add id', function () {
  graph(id).should.be.equal(graph);
});

test('add dep', function () {
  (typeof graph.items[id][dep]).should.equal('undefined');
  
  graph(id, dep).items[id].length.should.equal(1);
  graph.items[id][dep].should.equal(dep);
});

test('add dep2 to dep', function () {
  graph(dep, dep2).items[dep].length.should.equal(1);
});

test('resolve deps', function () {
  var msg = graph.resolve(id);
  
  (typeof msg).should.be.equal('undefined');
});

test('detect cycle', function () {
    
  graph(dep2, id).items[dep2].length.should.equal(1);

  var msg = graph.resolve(id);
  
  (typeof msg).should.be.equal('string');
  
  console.log(msg)
});