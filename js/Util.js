Util = {

  /**
   * http://dense13.com/blog/2009/05/03/converting-string-to-slug-javascript/
   */
  slugify : function(str) {
    return str
      .replace(/^\s+|\s+$/g, '')    // trim
      .toLowerCase()
      .replace(/[ @.]/g, '-')  // replace separators
      .replace(/[^a-z0-9 -]/g, '')  // remove invalid chars
      //.replace(/\s+/g, '-')         // collapse whitespace and replace by -
      .replace(/-+/g, '-');         // collapse dashes
  },

  empty : function(o) {
    for (var i in o) return false;
    return true;
  },

  equal: function(x, y) {
    if (Util.empty(x) !== Util.empty(y)) return false;
    for (var i in x) {
      var type = typeof(x[i]);
      if(type !== typeof(y[i])) return false;
      switch (type) {
        case 'object':
          if (!Util.equal(x[i], y[i])) return false
          break;
        default:
          if (x[i] !== y[i]) return false;
      }
    }
    for (var i in y) {
      if (typeof(x[i]) === 'undefined') return false;
    }
    return true;
  },

  isNumber : function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

};