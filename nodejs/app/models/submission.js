/*jslint node: true, eqeq: true */
/*global _, winston, async, config, models*/
'use strict';
var fs = require('fs-extra');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var judgeRpcClient = require('../../judge');

var _Submission, ClassMethods = {}, InstanceMethods = {};

ClassMethods.push = (function () {

  function checkValidation(data, cb) {
    data = data || {};
    var user = data.user,
      problem = data.problem,
      submissionData = data.submissionData,
      checkNotNull = function (cb) {
        function hasKey(items, data, cb) {
          async.every(items, function (item, cb) {
            cb(_.has(data, item));
          }, function (result) {
            cb(result ? null : new Error('validation failed'));
          });
        }

        async.waterfall([
          function (cb) { cb(user ? null : new Error('Not found user')); },
          function (cb) { cb(problem ? null : new Error('Not found problem')); },
          async.apply(hasKey, ['language', 'sourceCode'], submissionData)
        ], cb);
      };

    async.waterfall([
      checkNotNull
    ], function (err) {
      if (err) {
        return cb(new Error('Submission.push => checkValidation() failed.'));
      }
      cb(null);
    });
  }

  function transactionProcess(data, cb) {
    var sequelize = models.sequelize;
    sequelize.transaction(function (t) {
      var user = data.user,
        problem = data.problem,
        submissionData = data.submissionData,
        submission = _Submission.build({
          language: submissionData.language,
          codeLength: String(submissionData.sourceCode).length
        }),
        savingSubmission = function (cb) {
          submission.save({transaction: t})
            .success(function () {
              cb(null);
            })
            .error(cb);
        },
        setUserAssociate = function (cb) {
          user.addSubmission(submission, {transaction: t})
            .success(function () {
              cb(null);
            })
            .error(cb);
        },
        setProblemAssociate = function (cb) {
          problem.addSubmission(submission, {transaction: t})
            .success(function () {
              cb(null);
            })
            .error(cb);
        },
        savingSourceCode = function (cb) {
          var userSubmissionPath = user.getSubmissionPath(),
            sourceCodePath = path.join(userSubmissionPath, submission.id.toString()),
            mkdirpSubmissionDir = function (cb) {
              fs.mkdirp(userSubmissionPath, function (err) {
                if (err) {
                  return cb(err);
                }
                cb(null);
              });
            };

          async.waterfall([
            mkdirpSubmissionDir,
            async.apply(fs.writeFile, sourceCodePath, submissionData.sourceCode, {encoding: 'utf8'})
          ], cb);
        },
        transactionCommit = function (cb) {
          t.commit().success(cb);
        },
        transactionRollback = function (cb) {
          t.rollback().success(cb);
        };

      async.waterfall([
        savingSubmission,
        setUserAssociate,
        setProblemAssociate,
        savingSourceCode,
        transactionCommit
      ], function (err) {
        if (err) {
          return transactionRollback(function () {
            cb(err);
          });
        }
        cb(null, submission);
      });
    });
  }

  return function (data, cb) {
    async.waterfall([
      async.apply(checkValidation, data),
      async.apply(transactionProcess, data)
    ], function (err, submission) {
      if (err) {
        console.log(require('util').inspect(err));
        return cb(err);
      }

      console.log('Submission.push => cb');
      submission.judge(function (err, result) {
        console.log(err);
        cb(err, submission);
      });
    });
  };
}());

InstanceMethods.getSourceCodePath = function () {
  var self = this,
    userSubmissionPath = path.join(config.dir.submission, self.UserId.toString());

  return path.join(userSubmissionPath, self.id.toString());
};

InstanceMethods.getErrorPath = function () {
  var self = this,
    sourceCodePath = self.getSourceCodePath();

  return sourceCodePath + '.err';
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

InstanceMethods.judge = function (cb) {
  var self = this,
    getProblem = function (cb) {
      var Problem = models.Problem;
      Problem.find(self.ProblemId)
        .success(function (problem) {
          if (problem) {
            return cb(null, problem);
          }
          cb(new Error('Not found problem:' + self.ProblemId));
        })
        .error(cb);
    },
    rpcCall = function (data, cb) {
      judgeRpcClient({
        problem: data.problem.values,
        submission: data.submission.values
      }, cb);
    };

  async.waterfall([
    async.apply(async.series, {
      submission: function (cb) { cb(null, self); },
      problem: getProblem
    }),
    rpcCall
  ], function (err, result) {
    if (err) {
      return cb(err);
    }
    cb(null, result);
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
