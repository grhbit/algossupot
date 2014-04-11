'use strict';

var Submission;
Submission = (function (id) {
  function Submisison() {
    this.id = null;
    this.problem = null;
    this.user = null;
    this.language = null;
    this.state = null;
    this.timestamp = null;
  }

  var Query = {
    findById: sql.prepare('SELECT * FROM algossupot.submission WHERE id=:id LIMIT 1'),
    getRecent: sql.prepare(''),
    pushSubmit: sql.prepare('')
  };

  Submission.prototype.push = function () {
    sql.query(Query.pushSubmit(this))
      .on('result', function (res) {

      });
  };

  Submission.findById = function (id, cb) {
    sql.query(Query.findById(id))
      .on('result', function (res) {
        return undefined;
      });
  };

  Submission.getRecent = function (options, cb) {
    sql.query(Query.getRecent())
      .on('result', function (res) {

      });
  };

  Submission.pushSubmit = function (submission, cb) {
    sql.query(Query.pushSubmit())
      .on('result', function (res) {

      });
  }

  return Submission;
})();

module.exports = Submission;
