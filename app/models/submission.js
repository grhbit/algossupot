/*jslint node: true, eqeq: true */
/*global alog, async, config, db*/
'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');

var _Submission, ClassMethods = {}, InstanceMethods = {};

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
      cb(null, path.join(config.dir.Submission, user_id, problem_id));
    };

  async.series({
    user: getUser,
    problem: getProblem
  }, function (err, results) {
    if (err) {
      return callback(err);
    }

    var sourceCodeDir = getSourceCodePath(results.problem.id, results.user.id),
      sourceCodePath = path.join(sourceCodeDir, self.id.toString());
    async.waterfall([
      async.apply(fs.readFile, sourceCodePath)
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

    var sourceCodeDir = getSourceCodePath(results.problem.id, results.user.id),
      sourceCodePath = path.join(sourceCodeDir, self.id.toString());
    async.waterfall([
      async.apply(mkdirp, sourceCodeDir),
      async.apply(fs.writeFile, sourceCodePath, src, {encoding: 'utf-8'})
    ], function (err) {
      if (err) {
        return callback(err);
      }
      return callback();
    });
  });
};

module.exports = function (sequelize, DataTypes) {
  var Submission = sequelize.define('Submission', {
    state: DataTypes.INTEGER
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
