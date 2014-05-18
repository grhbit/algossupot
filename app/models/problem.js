/*jslint node: true, eqeq: true, vars: true */
/*global async, winston, config, models*/
'use strict';
var path = require('path'),
  fs = require('fs'),
  marked = require('marked'),
  mkdirp = require('mkdirp');

var _Problem, ClassMethods = {}, InstanceMethods = {};

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

ClassMethods.push = function (createForm, callback) {
  var User = models.User;
  var sequelize = models.sequelize;
  var checkValidation = function (cb) {
    var checkNotNull = function (cb) {
      if (createForm &&
          createForm.problem &&
          createForm.problem.slug &&
          createForm.problem.name &&
          createForm.problem.description &&
          createForm.problem.timeLimit &&
          createForm.problem.memoryLimit &&
          createForm.problem.diskLimit) {
        return cb(null);
      }
      cb(new Error('Insufficient Parameter'));
    };
    var checkType = function (cb) {
      var validate = true;
      validate = validate && (typeof createForm.problem.description === 'string');
      validate = validate && (!isNaN(createForm.problem.timeLimit));
      validate = validate && (!isNaN(createForm.problem.memoryLimit));
      validate = validate && (!isNaN(createForm.problem.diskLimit));

      if (validate) {
        return cb(null);
      }
      cb(new Error('`problem createForm` validation failed'));
    };

    async.waterfall([
      checkNotNull,
      checkType
    ], function (err) {
      if (err) {
        return cb(err);
      }
      cb(null);
    });
  };

  var transactionProcess = function (cb) {
    sequelize.transaction(function (t) {
      var problem = _Problem.build({
        slug: createForm.problem.slug,
        name: createForm.problem.name
      });

      var saveProblem = function (cb) {
        problem.save({transaction: t}).
          success(cb).error(cb);
      };
      var findUser = function (cb) {
        User.find(createForm.userId).
          success(function (user) {
            if (user) {
              return cb(null, user);
            }
            cb(new Error('Not Found User'));
          }).
          error(cb);
      };
      var setUserAssociate = function (user, cb) {
        user.addProblem(problem, {transaction: t}).
          success(cb).error(cb);
      };
      var saveToStorage = function (cb) {
        var problemDirectory = path.join(config.dir.problem, createForm.problem.slug);
        var contents = {
          timeLimit: createForm.problem.timeLimit,
          memoryLimit: createForm.problem.memoryLimit,
          diskLimit: createForm.problem.diskLimit
        };

        var saveDescription = function (cb) {
          fs.writeFile(path.join(problemDirectory, 'description.md'), createForm.problem.description, {
            encoding: 'utf8'
          }, function (err) {
            if (err) {
              return cb(err);
            }
            cb(null);
          });
        };
        var saveAttachments = function (cb) {
          //TODO: save createForm.problem.attachments
          cb(null);
        };
        var cleanDirectorySync = function (dir) {
          var list = fs.readdirSync(dir);
          var i = 0, filename, stat;
          for (i = 0; i < list.length; i = i + 1) {
            filename = path.join(dir, list[i]);
            stat = fs.statSync(filename);

            if (stat.isDirectory()) {
              cleanDirectorySync(filename);
            } else {
              fs.unlinkSync(filename);
            }
          }
          fs.rmdirSync(dir);
        };

        async.waterfall([
          async.apply(mkdirp, problemDirectory),
          async.apply(fs.writeFile, path.join(problemDirectory, './index.json'), JSON.stringify(contents), {
            encoding: 'utf8'
          }),
          saveDescription,
          saveAttachments
        ], function (err) {
          if (err) {
            cleanDirectorySync(problemDirectory);
            return cb(err);
          }
          cb(null, t);
        });
      };

      var transactionCommit = function (cb) {
        t.commit().success(cb);
      };
      var transactionRollback = function (cb) {
        t.rollback().success(cb);
      };

      async.waterfall([
        saveProblem, findUser, setUserAssociate, saveToStorage, transactionCommit
      ], function (err) {
        if (err) {
          return transactionRollback(function () {
            cb(err);
          });
        }
        return cb(null);
      });
    });
  };

  async.waterfall([
    checkValidation,
    transactionProcess
  ], callback);
};

module.exports = function (sequelize, DataTypes) {
  var Problem = sequelize.define('Problem', {
    slug: {
      type: DataTypes.STRING(32),
      validate: { is: ['^[a-z\\-]+$', 'i'], len: [4, 32] }
    },
    name: {
      type: DataTypes.STRING(32),
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
