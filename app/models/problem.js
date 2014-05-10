/*jslint node: true, eqeq: true */
/*global async, winston, config, db*/
'use strict';
var path = require('path'),
  fs = require('fs'),
  marked = require('marked'),
  mkdirp = require('mkdirp');

var _Problem, ClassMethods = {}, InstanceMethods = {};
InstanceMethods.loadContents = function (callback) {
  var self = this,
    problemDir = path.join(config.dir.storage, './problems', String(self.id)),
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
          return cb();
        }
        return cb('not exists problem index or description');
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
          info: index,
          problem_content: results.description
        });
      });
    };

  async.waterfall([
    checkFiles,
    readContents
  ],
    function (err, metadata) {
      if (err) {
        return callback(err);
      }

      metadata.id = self.id;
      metadata.name = self.name;
      metadata.slug = self.slug;
      return callback(null, metadata);
    });
};

module.exports = function (sequelize, DataTypes) {
  var Problem = sequelize.define('Problem', {
    slug: {
      type: DataTypes.STRING,
      validate: { is: ['[[a-z\\-]', 'i'] }
    },
    name: {
      type: DataTypes.STRING(32),
      validate: { is: ['^[a-zㄱ-ㅎㅏ-ㅣ가-힣\\- ]{1,32}$', 'i'] }
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
