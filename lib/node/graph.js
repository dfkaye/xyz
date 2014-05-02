/*
 * super simple dependency graph to track requests and keep cycles to a minimum
 */
module.exports = graph;
function graph(id, dep) {

  graph.resolve || (graph.resolve = resolve);
  graph.items || (graph.items = {});
  
  var item = graph.items[id] || (graph.items[id] = []);
  
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));
    
  return graph;
}

function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    return 'cycle: ' + visited.concat(id).join(' > ');
  }
  
  visited[id] = visited[visited.push(id) - 1];

  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
    msg = resolve(deps[i], visited);
    if (msg) {
      return msg;
    }
  }
}
