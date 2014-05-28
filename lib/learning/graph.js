/*
 * super simple dependency graph to track requests and keep cycles to a minimum
 */
if (typeof require == 'function' && typeof module != 'undefined') {
  module.exports = graph;
}

/*
graph(id);
graph.items[id] = [];
graph(id, dep);
graph.items[id] = [dep];
graph.resolve(id);
note that [].push() returns new length
*/

/*
 * memoizing registry
 * maps id string if not mapped
 * maps dep string if not mapped
 * adds dep string to id map
 */
function graph(id, dep) {

  graph.items || (graph.items = {});
  
  var item;
  
  !id || (item = graph.items[id] || (graph.items[id] = []));
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));
    
  return graph;
};

/*
 * recursively visits id string map items, depth first.
 * returns message string if a cycle is detected
 */
graph.resolve = function resolve(id, visited) {

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
};
