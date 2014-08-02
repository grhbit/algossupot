/*jslint node: true, eqeq: true */
/*global _, async, winston, config, models*/
'use strict';
var path = require('path'),
  fs = require('fs-extra'),
  marked = require('marked'),
  mkdirp = require('mkdirp');

var _Problem, ClassMethods = {}, InstanceMethods = {};

InstanceMethods.getPath = function () {
  return path.join(config.dir.problem, String(this.slug));
};

InstanceMethods.loadContents = function (callback) {
  var self = this,
    problemDir = path.join(config.dir.problem, String(self.slug)),
    indexPath = path.join(problemDir, './index.json'),
    descriptionPath = path.join(problemDir, './description.md'),
    checkFiles = function (cb) {
      var checkExists = function (path, cb) {
        fs.stat(path, function (err, stat) {
          if (err) {
            return cb(false);
          }
          return cb(stat.isFile());
        });
      };

      async.every([indexPath, descriptionPath], checkExists, function (result) {
        if (result) {
          return cb(null);
        }
        cb('not exists problem index or description');
      });
    },
    readContents = function (cb) {
      async.parallel({
        index: async.apply(fs.readFile, indexPath),
        description: async.apply(fs.readFile, descriptionPath)
      }, function (err, results) {
        if (err) {
          return cb(err);
        }

        var index = JSON.parse(results.index);
        return cb(null, {
          index: index,
          description: results.description
        });
      });
    };

  async.waterfall([
    checkFiles,
    readContents
  ],
    function (err, data) {
      if (err) {
        return callback(err);
      }

      return callback(null, data);
    });
};

ClassMethods.push = (function () {
  var checkValidation = function (data, cb) {
      data = data || {};
      var problemData = data.problemData,
        user = data.user,
        checkNotNull = function (cb) {
          var hasKey = function (items, data, cb) {
            async.every(items, function (item, cb) {
              cb(_.has(data, item));
            }, function (result) {
              cb(result ? null : new Error('validation failed'));
            });
          };

          async.waterfall([
            function (cb) { cb(user ? null : new Error('Not found user')); },
            async.apply(hasKey, ['metadata', 'limit', 'mark'], problemData),
            async.apply(hasKey, ['slug', 'name'], problemData.metadata),
            async.apply(hasKey, ['time', 'memory', 'disk'], problemData.limit),
            async.apply(hasKey, ['in', 'out'], problemData.mark),
            async.apply(hasKey, ['method', 'path'], problemData.mark.in),
            async.apply(hasKey, ['method', 'path'], problemData.mark.out)
          ], cb);
        };

      async.waterfall([
        checkNotNull
      ], function (err) {
        if (err) {
          return cb(new Error('Problem.push => checkValidation() failed.'));
        }
        cb(null);
      });
    },
    transactionProcess = function (data, cb) {
      var sequelize = models.sequelize;
      sequelize.transaction(function (t) {
        var user = data.user,
          problemData = data.problemData,
          problem = _Problem.build({
            slug: problemData.metadata.slug,
            name: problemData.metadata.name
          }),
          savingProblem = function (cb) {
            problem.save({transaction: t})
              .success(function () {
                cb();
              })
              .error(cb);
          },
          setUserAssociate = function (cb) {
            user.addProblem(problem, {transaction: t})
              .success(function () {
                cb();
              })
              .error(cb);
          },
          savingContentsToStorage = function (cb) {
            var problemDir = path.join(config.dir.problem, problem.slug),
              indexData = _.omit(problemData, 'description'),
              descriptionData = problemData.description || '',
              mkdirpProblemDir = function (cb) {
                fs.mkdirp(problemDir, function (err) {
                  if (err) {
                    return cb(err);
                  }
                  cb(null);
                });
              },
              savingIndex = async.apply(fs.writeJson, path.join(problemDir, './index.json'), indexData, {encoding: 'utf8'}),
              savingDescription = async.apply(fs.writeFile, path.join(problemDir, './description.md'), descriptionData, {encoding: 'utf8'}),
              savingAttachments = function (cb) {
                //TODO: save input, output script file
                cb(null);
              };

            async.waterfall([
              mkdirpProblemDir,
              savingIndex,
              savingDescription,
              savingAttachments
            ], function (err) {
              if (err) {
                return fs.remove(problemDir, function (er) {
                  if (er) {
                    return cb(er);
                  }
                  cb(err);
                });
              }
              cb(null);
            });
          },
          transactionCommit = function (cb) {
            t.commit().success(cb);
          },
          transactionRollback = function (cb) {
            t.rollback().success(cb);
          };

        async.waterfall([
          savingProblem,
          setUserAssociate,
          savingContentsToStorage,
          transactionCommit
        ], function (err) {
          if (err) {
            return transactionRollback(function () {
              cb(err);
            });
          }
          cb(null);
        });
      });
    };

  return function (data, cb) {
    async.waterfall([
      async.apply(checkValidation, data),
      async.apply(transactionProcess, data)
    ], function (err) {
      if (err) {
        console.log(require('util').inspect(err));
        return cb(err);
      }
      cb(null);
    });
  };
}());

module.exports = function (sequelize, DataTypes) {
  var Problem = sequelize.define('Problem', {
    slug: {
      type: DataTypes.STRING(32),
      notNull: true,
      unique: true,
      validate: { is: ['^[a-z\\-]+$', 'i'], len: [4, 32] }
    },
    name: {
      type: DataTypes.STRING(32),
      notNull: true,
      unique: true,
      validate: { is: ['^[a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣\\- ]+$', 'i'], len: [1, 32] }
    }
  }, {
    associate: function (models) {
      Problem
        .hasMany(models.Submission)
        .belongsTo(models.User);
    },
    classMethods: ClassMethods,
    instanceMethods: InstanceMethods
  });

  _Problem = Problem;

  return Problem;
};
