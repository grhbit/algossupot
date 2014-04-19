/*jslint node: true, eqeq: true */
/*global async, alog, config, db*/
'use strict';
var path = require('path'),
  fs = require('fs'),
  marked = require('marked'),
  mkdirp = require('mkdirp');

var Regex = {
  metadata: {
    name: /^[A-Za-z\-ㄱ-하-ㅣ가-힣 ]{1,32}$/
  }
};

module.exports = function (sequelize, DataTypes) {
  var Problem = sequelize.define('Problem', {
    slug: {
      type: DataTypes.STRING,
      validate: { is: ['[[a-z-]', 'i'] }
    },
    name: {
      type: DataTypes.STRING,
      validate: { is: ['^[a-zㄱ-ㅎㅏ-ㅣ가-힣\\- ]{1,32}$', 'i'] }
    }
  }, {});

  Problem.sync();
  return Problem;
};

function Problem(params) {
  params = params || {};
  params.metadata = params.metadata || {};
  params.contents = params.contents || {};

  this.id = null;

  // DB에 저장
  this.metadata = {
    userId: params.metadata.userId || null,
    name: params.metadata.name || null
  };

  // 파일(index.json)으로 저장
  this.contents = {
    description: params.contents.description || null
  };
}

//#region - static functions

Problem.validating = function (metadata, contents) {
  var res = {
    result: true,
    detail: {
      metadata: true,
      contents: true
    }
  };

  if (metadata == null ||
      metadata.name == null || !Regex.metadata.name.test(metadata.name)) {
    res.result = false;
    res.detail.metadata = false;
  }

  if (contents == null) {
    res.result = false;
    res.detail.contents = false;
  }

  return res;
};

Problem.loadById = function (id, callback) {
  alog.info('Problem.loadById#' + id);

  async.waterfall([
    function (cb) {
      db.select()
        .where({id: id})
        .limit(1)
        .get('problem', function (err, results, fields) {
          if (err) {
            cb(err);
          } else {
            cb(null, results[0]);
          }
        });
    },
    function (metadata, cb) {
      var indexPath = path.join(config.dir.storage, './problems/', id, './index.json');

      fs.stat(indexPath, function (err, stats) {
        if (err) {
          callback(err);
        } else {
          fs.readFile(indexPath, function (err, data) {
            var problemInfo = JSON.parse(data);
            metadata.info = problemInfo;
            cb(null, metadata);
          });
        }
      });
    },
    function (metadata, cb) {
      var descriptionPath = path.join(config.dir.storage, './problems/', id, './description.md');

      fs.stat(descriptionPath, function (err, stats) {
        if (err) {
          callback(err);
        } else {
          fs.readFile(descriptionPath, function (err, data) {
            // metadata.problem_content = marked(String(data));
            metadata.problem_content = String(data);
            cb(null, metadata);
          });
        }
      });
    }
  ], function (err, metadata) {
    if (err) {
      callback(err);
    } else {
      // var problem = new Problem({
      //   metadata: metadata
      // });
      var problem = {};
      problem.metadata = metadata;
      callback(null, problem);
    }
  });
};

//#endregion - static functions
