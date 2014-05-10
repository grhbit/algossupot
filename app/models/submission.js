/*jslint node: true, eqeq: true */
/*global winston, async, config, db*/
'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var Judge = require('../../judge');

var _Submission, ClassMethods = {}, InstanceMethods = {};

InstanceMethods.getSourceCodePath = function (callback) {
  var self = this,
    getUser = function (cb) {
      self.getUser()
        .success(function (user) {
          if (user) {
            return cb(null, user);
          }
          return cb('not found user');
        })
        .error(function (err) {
          return cb(err);
        });
    },
    getProblem = function (cb) {
      self.getProblem()
        .success(function (problem) {
          if (problem) {
            return cb(null, problem);
          }
          return cb('not found problem');
        })
        .error(function (err) {
          return cb(err);
        });
    };

  async.series({
    user: getUser,
    problem: getProblem
  }, function (err, results) {
    if (err) {
      return callback(err);
    }

    return callback(null, path.join(config.dir.submission, results.user.id.toString(), results.problem.id.toString()));
  });

};

InstanceMethods.loadSourceCode = function (callback) {
  var self = this,
    getUser = function (cb) {
      self.getUser()
        .success(function (user) {
          if (user) {
            return cb(null, user);
          }
          return cb('not found user');
        })
        .error(function (err) {
          return cb(err);
        });
    },
    getProblem = function (cb) {
      self.getProblem()
        .success(function (problem) {
          if (problem) {
            return cb(null, problem);
          }
          return cb('not found problem');
        })
        .error(function (err) {
          return cb(err);
        });
    },
    getSourceCodePath = function (problem_id, user_id, cb) {
      return path.join(config.dir.submission, user_id.toString(), problem_id.toString());
    };

  async.series({
    user: getUser,
    problem: getProblem
  }, function (err, results) {
    if (err) {
      return callback(err);
    }

    var sourceCodeExt = '.' + (config.lang.ext[self.lang] || ''),
      sourceCodeDir = getSourceCodePath(results.problem.id, results.user.id),
      sourceCodePath = path.join(sourceCodeDir, self.id.toString());
    async.waterfall([
      async.apply(fs.readFile, sourceCodePath + sourceCodeExt)
    ], function (err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, data);
    });
  });
};

InstanceMethods.saveSourceCode = function (src, callback) {
  var self = this,
    getUser = function (cb) {
      self.getUser()
        .success(function (user) {
          if (user) {
            return cb(null, user);
          }
          return cb('not found user');
        })
        .error(function (err) {
          return cb(err);
        });
    },
    getProblem = function (cb) {
      self.getProblem()
        .success(function (problem) {
          if (problem) {
            return cb(null, problem);
          }
          return cb('not found problem');
        })
        .error(function (err) {
          return cb(err);
        });
    },
    getSourceCodePath = function (problem_id, user_id) {
      return path.join(config.dir.submission, user_id.toString(), problem_id.toString());
    };

  async.series({
    user: getUser,
    problem: getProblem
  }, function (err, results) {
    if (err) {
      return callback(err);
    }

    // Dos2Unix
    src = src.replace(/(\x0d)/g, "");
    var sourceCodeExt = '.' + (config.lang.ext[self.lang] || ''),
      sourceCodeDir = getSourceCodePath(results.problem.id, results.user.id),
      sourceCodePath = path.join(sourceCodeDir, self.id.toString());
    async.waterfall([
      async.apply(mkdirp, sourceCodeDir),
      async.apply(fs.writeFile, sourceCodePath + sourceCodeExt, src, {encoding: 'utf-8'})
    ], function (err) {
      if (err) {
        return callback(err);
      }
      return callback();
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
    return callback('submission invalid state');
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
    state: {
      type: DataTypes.INTEGER,
      defaultValue: config.state.indexOf('Pending')
    },
    lang: {
      type: DataTypes.STRING,
      defaultValue: 'C++',
      isIn: [config.lang.list],
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
