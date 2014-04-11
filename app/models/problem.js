'use strict';

var Problem;
Problem = (function (sql) {
  function Problem() {
    this.id = null;
  }

  var Query = {
    findById: sql.prepare('')
  };

  return Problem;
})();

module.exports = Problem;
