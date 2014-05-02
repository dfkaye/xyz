/*
 * super simple dependency graph to track requests and keep cycles to a minimum
 */
module.exports = graph;

/*
graph(id);
graph.items[id] = [];
graph(id, dep);
graph.items[id] = [dep];
graph.resolve(id);
*/

/*
 * maps id string if not mapped
 * maps dep string if not mapped
 * adds dep string to id map
 */
function graph(id, dep) {

  graph.as || (graph.as = as);
  graph.resolve || (graph.resolve = resolve);
  graph.items || (graph.items = {});
  
  var item;
  
  !id || (item = graph.items[id] || (graph.items[id] = []));
  // add dep to id map;  [].push() returns new length
  !dep || (item[dep] || (item[dep] = item[item.push(dep) - 1]));
    
  return graph;
}

/*
 * recursively visits id string map items
 * returns message string if a cycle is detected
 */
function resolve(id, visited) {

  visited || (visited = []);

  if (visited[id]) {
    return 'cycle: ' + visited.concat(id).join(' > ');
  }
  
  // [].push() returns new length
  visited[id] = visited[visited.push(id) - 1];

  for (var i = 0, deps = graph.items[id], msg; deps && i < deps.length; ++i) {
    msg = resolve(deps[i], visited);
    if (msg) {
      return msg;
    }
  }
}

/*
// lookup
graph.as(id, alias);
graph.as.items[as] = { id: id, as: alias };
*/

function as(id, alias) {
  return as[alias] || (as[alias] = { id: id, as: alias });
}
