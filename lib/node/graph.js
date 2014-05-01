// track requests and keep cycles to a minimum

var graph = module.exports = {
  add: add,
  resolve: resolve,
  items: {}
};

function add(id, dep) {

  var item = graph.items[id] || (graph.items[id] = []);
  
  if (dep && !item[dep]) {
    item[dep] = dep;
    item.push(dep);
  }
  
  return item;
}

function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    visited.push(id);
    //console.log(visited.reverse().join(' > '));
    throw new Error('cycle: ' + visited.reverse().join(' > '));
  }
  
  visited[id] = id;
  visited.push(id);
  
  var deps = graph.items[id];
  
  for (var i = 0; deps && i < deps.length; ++i) {
    resolve(deps[i], visited);
  }
}
