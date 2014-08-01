/*jslint node: true, eqeq: true, vars: true */
/*global winston, async, config, models*/
'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var judgeRpcClient = require('../../judge');

var _Submission, ClassMethods = {}, InstanceMethods = {};

ClassMethods.push = function (submissionMember, userId, problemId, callback) {
  var User = models.User;
  var Problem = models.Problem;
  var sequelize = models.sequelize;
  var findUserById = function (cb) {
    User.find(userId).
      success(function (user) {
        if (user) {
          return cb(null, user);
        }
        cb(new Error('Not found User'));
      }).
      error(function (err) {
        cb(err);
      });
  };
  var findProblemById = function (cb) {
    Problem.find(problemId).
      success(function (problem) {
        if (problem) {
          return cb(null, problem);
        }
        cb(new Error('Not found problem'));
      }).
      error(function (err) {
        cb(err);
      });
  };
  var createSubmission = function (err, results) {
    sequelize.transaction(function (t) {
      var submission = _Submission.build({
        language: submissionMember.language,
        codeLength: String(submissionMember.sourceCode).length
      });

      var saveSubmission = function (cb) {
        submission.save({ transaction: t }).
          success(function () {
            cb(null);
          }).
          error(function (err) {
            cb(err);
          });
      };
      var userAddSubmission = function (cb) {
        results.user.addSubmission(submission, { transaction: t }).
          success(function () {
            cb(null);
          }).
          error(function (err) {
            cb(err);
          });
      };
      var problemAddSubmission = function (cb) {
        results.problem.addSubmission(submission, { transaction: t }).
          success(function () {
            cb(null);
          }).
          error(function (err) {
            cb(err);
          });
      };
      var saveSourceCode = function (cb) {
        var dos2unix = function (cb) {
          cb(null, submissionMember.sourceCode.replace(/(\0xd)/g, ''));
        };
        var makeDirectory = function (cb) {
          var dirname = path.dirname(submission.getSourceCodePath());
          fs.stat(dirname, function (err, stats) {
            if (err) {
              return mkdirp(dirname, function (err) {
                if (err) {
                  return cb(err);
                }
                cb(null);
              });
            }
            if (!stats.isDirectory()) {
              return cb(new Error('makeDirectory failed'));
            }

            cb(null);
          });
        };
        async.waterfall([
          makeDirectory,
          dos2unix,
          async.apply(fs.writeFile, submission.getSourceCodePath())
        ], function (err) {
          if (err) {
            return cb(err);
          }
          cb(null);
        });
      };
      var transactionCommit = function (cb) {
        t.commit().success(cb);
      };
      var transactionRollback = function (cb) {
        t.rollback().success(cb);
      };

      if (err) {
        return callback(err);
      }

      async.waterfall([
        saveSubmission,
        userAddSubmission,
        problemAddSubmission,
        saveSourceCode,
        transactionCommit
      ], function (err) {
        if (err) {
          transactionRollback(function () {
            return callback(err);
          });
        }
        submission.judge();
        callback(null);
      });
    });
  };

  async.series({
    user: findUserById,
    problem: findProblemById
  }, createSubmission);
};

InstanceMethods.getSourceCodePath = function () {
  var self = this;
  var userSubmissionFolder = path.join(config.dir.submission, self.UserId.toString());
  var sourceCodeExt = config.lang.ext[self.language];

  return path.join(userSubmissionFolder, self.id.toString() + '.' + sourceCodeExt);
};

InstanceMethods.getErrorPath = function () {
  var self = this;
  var userSubmissionFolder = path.join(config.dir.submission, self.UserId.toString());

  return path.join(userSubmissionFolder, self.id.toString() + '.err');
};

InstanceMethods.loadSourceCode = function (callback) {
  var self = this;

  fs.readFile(self.getSourceCodePath(), function (err, data) {
    if (err) {
      return callback(err);
    }
    callback(null, data);
  });
};

InstanceMethods.loadErrorMessage = function (callback) {
  var self = this;

  fs.readFile(self.getErrorPath(), function (err, data) {
    if (err) {
      return callback(err);
    }
    callback(null, data);
  });
};

InstanceMethods.updateState = function (state, callback) {
  var self = this;
  self.updateAttributes({
    state: state
  }).
    success(callback).
    error(callback);
};

InstanceMethods.judge = function () {
  var self = this,
    source = {
      path: self.getSourceCodePath(),
      language: self.language
    },
    getProblem = function (cb) {
      models.Problem.find(self.ProblemId).
        success(function (problem) {
          cb(null, problem);
        }).
        error(function (err) {
          cb(err);
        });
    },
    readContents = function (problem, cb) {
      problem.loadContents(function (err, contents) {
        if (err) {
          return cb(err);
        }

        cb(null, contents.index);
      });
    },
    sendToJudgeMsg = function (problem, cb) {
      judgeRpcClient({
        source: source,
        problem: problem
      }, cb);
    };

  async.waterfall([
    getProblem,
    readContents,
    sendToJudgeMsg
  ], function (err, reply) {
    if (err) {
      console.error(err);
      return err;
    }

    console.log(reply);
  });
};

module.exports = function (sequelize, DataTypes) {
  var Submission = sequelize.define('Submission', {
    language: {
      type: DataTypes.STRING(32),
      notNull: true,
      isIn: [config.lang.list]
    },
    state: {
      type: DataTypes.STRING(32),
      notNull: true,
      isIn: [config.state],
      defaultValue: config.state[0]
    },
    codeLength: {
      type: DataTypes.INTEGER.UNSIGNED,
      notNull: true
    },
    timeUsage: DataTypes.INTEGER.UNSIGNED,
    memoryUsage: DataTypes.INTEGER.UNSIGNED,
    diskUsage: DataTypes.INTEGER.UNSIGNED
  }, {
    associate: function (models) {
      Submission
        .belongsTo(models.User)
        .belongsTo(models.Problem);
    },
    classMethods: ClassMethods,
    instanceMethods: InstanceMethods
  });

  _Submission = Submission;

  return Submission;
};
