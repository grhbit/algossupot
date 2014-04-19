/*jslint node: true, eqeq: true */
/*global alog, async, config, db*/
'use strict';

module.exports = function (sequelize, DataTypes) {
  var Submission = sequelize.define('Submission', {
    state: DataTypes.INTEGER
  }, {
    associate: function (models) {
      return undefined;
    }
  });

  Submission.sync();

  return Submission;
};

function loadSubmissionById(id, callback) {
  db.select()
    .where({id: id})
    .limit(1)
    .get(config.db.tableName.submission, function (err, results, fields) {
      if (err) {
        callback(err);
      } else if (results.length === 0) {
        callback('not found submission');
      } else {
        callback(null, {
          id: id,
          problemId: results[0].problemId,
          userId: results[0].userId,
          state: results[0].state
        });
      }
    });
}

function insertToDB(obj, callback) {
  db.insert(config.db.tableName.submission, {
    'problem_id': obj.problemId,
    'user_id': obj.userId,
    'state': obj.state
  }, function (err, info) {
    if (err) {
      callback(err);
    } else {
      obj.id = info.insertId;
      callback(null, obj);
    }
  });
}

function Submission() {
  this.id = null;

  this.problemId = null;
  this.userId = null;
  this.state = null;
}

Submission.validating = function (submission, callback) {
  if (submission) {
    var hasProblemId = submission.problemId != null,
      hasUserId = submission.userId != null,
      hasState = submission.state != null;

    callback(null, {
      result: hasProblemId && hasUserId && hasState
    });
  } else {
    callback('submission is null');
  }
};

Submission.loadById = function (id, callback) {
  alog.info('Submission.loadById#' + id);
  loadSubmissionById(id, function (err, obj) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Submission(obj));
    }
  });
};

Submission.submit = function (user, problem, code, callback) {
  user = user || {};
  problem = problem || {};
  code = code || {};

  async.waterfall([
    function (cb) {
      if (user.id == null || problem.id == null) {
        cb('invalid submit');
      } else {
        cb(null, {
          problemId: problem.id,
          userId: user.id,
          state: 0
        });
      }
    },
    insertToDB,
    //@TODO: 채점 요청
    function (cb) {
      cb();
    }
  ], function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
};

Submission.submit = function (submission, callback) {
  async.waterfall([
    function (cb) { cb(null, submission); },
    insertToDB
  ], function (err) {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  });
};

// module.exports = Submission;
