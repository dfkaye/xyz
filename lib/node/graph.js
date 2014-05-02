/*
 * super simple dependency graph to track requests and keep cycles to a minimum
 */
module.exports = graph;
function graph(id, dep) {

  graph.resolve || (graph.resolve = resolve);
  graph.items || (graph.items = {});
  
  var item = graph.items[id] || (graph.items[id] = []);
  
  if (dep && !item[dep]) {
    item[dep] = dep;
    item.push(dep);
  }
  
  return graph;
}

function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    visited.push(id);
    return 'cycle: ' + visited.reverse().join(' > ')
  }
  
  visited[id] = id;
  visited.push(id);
    
  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
    msg = resolve(deps[i], visited);
    if (msg) {
      return msg;
    }
  }
}
