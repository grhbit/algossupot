/*jslint node: true, eqeq: true, vars: true */
/*global winston, async, config, models*/
'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var Judge = require('../../judge');

var _Submission, ClassMethods = {}, InstanceMethods = {};

ClassMethods.push = function (submissionMember, userId, problemId, callback) {
  var User = models.User;
  var Problem = models.Problem;
  var findUserById = function (cb) {
    User.find(userId).
      success(function (user) {
        cb(null, user);
      }).
      error(function (err) {
        cb(err);
      });
  };
  var findProblemById = function (cb) {
    Problem.find(problemId).
      success(function (problem) {
        cb(null, problem);
      }).
      error(function (err) {
        cb(err);
      });
  };
  var createSubmission = function (err, results) {
    var userAddSubmission = function (submission, cb) {
      results.user.addSubmission(submission).
        complete(function (err) {
          cb(err);
        });
    };
    var problemAddSubmission = function (submission, cb) {
      results.problem.addSubmission(submission).
        complete(function (err) {
          cb(err);
        });
    };
    var saveSourceCode = function (sourceCode, path, cb) {
      fs.writeFile(path, sourceCode.replace(/(\x0d)/g, ''), function (err) {
        if (err) {
          return cb(err);
        }
        return cb(null);
      });
    };
    var sourceCode = submissionMember.sourceCode;

    if (err) {
      return callback(err);
    }

    _Submission.create({
      language: submissionMember.language,
      codeLength: sourceCode.length,
    }).
      success(function (submission) {
        async.waterfall([
          async.apply(userAddSubmission, submission),
          async.apply(problemAddSubmission, submission),
          submission.getSourceCodePath,
          mkdirp,
          async.apply(saveSourceCode, sourceCode)
        ], function (err, result) {
          if (err) {
            return callback(err);
          }
          return callback(null);
        });
      }).
      error(function (err) {
        return callback(err);
      });
  };

  async.series({
    user: findUserById,
    problem: findProblemById
  }, createSubmission);
};

InstanceMethods.getSourceCodePath = function (callback) {
  var self = this;
  var userSubmissionFolder = path.join(config.dir.submission, self.user.id.toString());
  var sourceCodeExt = config.lang.ext[self.language];

  return callback(null, path.join(userSubmissionFolder, self.id, sourceCodeExt));
};

InstanceMethods.loadSourceCode = function (callback) {
  var self = this;

  self.getSourceCodePath(function (err, path) {
    async.waterfall([
      self.getSourceCodePath,
      fs.readFile
    ], function (err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, data);
    });

  });
};

InstanceMethods.updateState = function (state, callback) {
  var self = this, iState = 0;

  if (typeof state === 'string') {
    iState = config.state.indexOf(state);
  } else if (typeof state === 'number') {
    iState = state;
  }

  if (iState === -1) {
    return callback(new Error('submission invalid state'));
  }

  self.state = iState;
  self.save(['state'])
    .success(function () {
      return callback(null, self);
    }).error(function (err) {
      return callback(err);
    });
};

InstanceMethods.judge = function (callback) {
  var self = this,
    judgeStream = new Judge(self);

  judgeStream
    .on('state', function (state) {
      self.updateState(state, function (err, submission) {
        return undefined;
      });
    })
    .on('exit', function (code) {
      callback(null, code);
    });
};

module.exports = function (sequelize, DataTypes) {
  var Submission = sequelize.define('Submission', {
    language: {
      type: DataTypes.STRING,
      notNull: true,
      isIn: [config.lang.list]
    },
    codeLength: {
      type: DataTypes.INTEGER,
      notNull: true,
      min: 0
    },
    state: {
      type: DataTypes.INTEGER,
      notNull: true,
      defaultValue: config.state.indexOf('Pending')
    },
    executionTime: {
      type: DataTypes.INTEGER,
      min: 0
    }
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
