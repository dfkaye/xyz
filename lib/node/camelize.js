// camelize

var RE_SEP = /\-|\./;
var RE_SEP_AZ = /(\-|\.)[a-z]/;
var RE_SEP_AZ_G = /(\-|\.)[a-z]/g;
var RE_WS = /[\s]+/g;
var BLANK = '';

module.exports = camelize;
function camelize(name) {

  var ext = BLANK;
  var id, match, ch, i;
    
  if (name.indexOf('.') > 0) {
    ext = name.substring(name.lastIndexOf('.'), name.length);
  }
  
  // replace windows backslash separators
  id = name.replace(/\\/g, '/').split('/').slice(-1)[0];
  id = id.substring(0, id.lastIndexOf(ext));
    
  if (match = id.match(RE_SEP_AZ_G)) {
    for (i = 0; i < match.length; i++) {
      ch = match[i].replace(RE_SEP, BLANK).toUpperCase();
      id = id.replace(RE_SEP_AZ, ch);
    }
  }
  
  return (id.substring(0, id.lastIndexOf('.')) || id).replace(RE_WS, BLANK);
}