// graph test

require('../../../lib/node/monad');

var graph = define.graph;

var assert = require('assert');


var id = __filename.replace(/\\/g, '/');
var dep = './some/dep.js';
var dep2 = './some/dep2.js';

suite('graph');

test('add id', function () {
  assert(graph(id) === graph, 'should return graph');
});

test('add dep', function () {
  assert(typeof graph.items[id][dep] === 'undefined');
  
  assert(graph(id, dep).items[id].length=== 1, 'should have 1 item');
  assert(graph.items[id][dep] === dep, 'should map dependency');
});

test('add dep2 to dep', function () {
  assert(graph(dep, dep2).items[dep].length === 1, 'should add 1 item');
});

test('resolve deps ok', function () {  
  assert(typeof graph.resolve(id) === 'undefined', 'should return undefined');
});

test('throws if cycle detected', function () {
    
  assert(graph(dep2, id).items[dep2].length === 1, 'add new item');

  var msg = 'cycle: ' + id + ' > ' + dep + ' > ' + dep2 + ' > ' + id;
  var cycle;
  try {
    graph.resolve(id);
  } catch(error) {
    cycle = error.message;
  } finally {
    assert(cycle === msg, 'incorrect cycle message');
    
    // clean up
    delete graph.items[dep2];
    graph(dep2);
  }
});
