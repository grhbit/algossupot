/*jslint node: true, eqeq: true */
/*global async, alog, config, db*/
'use strict';
var path = require('path'),
  fs = require('fs'),
  mkdirp = require('mkdirp');

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

function loadMetadataById(id, cb) {
  db.select()
    .where({id: id})
    .limit(1)
    .get('problem', function (err, results, fields) {
      if (err) {
        cb(err);
      } else if (results.length === 0) {
        cb('not found problem');
      } else {
        cb(null, {
          id: id,
          metadata: results[0]
        });
      }
    });
}

function loadMetaDataBySlug(slug, cb) {
  db.select()
    .where({slug: slug})
    .limit(1)
    .get(config.db.tableName.problem, function (err, results, fields) {
      if (err) {
        cb(err);
      } else if (results.length === 0) {
        cb('not found problem');
      } else {
        cb(null, {
          id: results[0].id,
          metadata: results[0]
        });
      }
    });
}

function loadContents(obj, cb) {
  var indexPath = path.join(config.dir.storage, './problems', obj.metadata.slug, './index.json');

  fs.stat(indexPath, function (err, stats) {
    if (err) {
      cb(err);
      return;
    }

    fs.readFile(indexPath, function (err, data) {
      if (err) {
        cb(err);
        return;
      }

      try {
        var problemInfo = JSON.parse(data);
        obj.contents = problemInfo.contents;
        cb(null, obj);
      } catch (e) {
        cb(e);
      }
    });
  });
}

function makeDirectoryFromSlug(slug, callback) {
  var problemDir = path.join(config.dir.storage, './problems', slug);
  mkdirp(problemDir, '0755', function (err, made) {
    if (err) {
      callback(err);
    } else {
      callback(null, problemDir);
    }
  });
}

function insertMetadataToDB(obj, callback) {
  if (obj == null || obj.metadata == null) {
    callback('invalid problem');
    return;
  }

  async.waterfall([
    function (cb) {
      db.where({slug: obj.metadata.slug})
        .count(config.db.tableName.problem, function (err, rows, fields) {
          if (err) {
            cb(err);
          } else if (rows !== 0) {
            cb('already exists problem');
          } else {
            cb(null);
          }
        });
    },
    function (cb) {
      db.insert(config.db.tableName.problem, {
        slug: obj.metadata.slug,
        userId: obj.metadata.userId,
        name: obj.metadata.name
      }, function (err, info) {
        if (err) {
          cb(err);
        } else {
          obj.id = info.insertId;
          cb(null, obj);
        }
      });
    }
  ], function (err, obj) {
    if (err) {
      callback(err);
    } else {
      callback(null, obj);
    }
  });
}

function writeContentsToFile(path, obj, callback) {
  if (obj == null || obj.contents == null) {
    callback('invalid contents');
    return;
  }

  var data = {
    index: {contents: obj.contents}
  };

  fs.writeFile(path, JSON.stringify(data), function (err) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, obj);
  });
}

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
    function (cb) { cb(null, id); },
    loadMetadataById,
    loadContents,
  ], function (err, obj) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Problem(obj));
    }
  });
};

Problem.loadBySlug = function (slug, callback) {
  alog.info('Problem.loadBySlug#' + slug);

  async.waterfall([
    function (cb) { cb(null, slug); },
    loadMetaDataBySlug,
    loadContents,
  ], function (err, obj) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Problem(obj));
    }
  });
};

Problem.exists = function (slug, callback) {
  var indexPath = path.join(config.dir.storage, './problems', slug, './index.json');

  fs.stat(indexPath, function (err, stats) {
    if (err) {
      callback(null, false);
    } else {
      callback(null, stats.isFile());
    }
  });
};

Problem.new = function (metadata, contents, callback) {
  async.waterfall([
    function (cb) { cb(null, {metadata: metadata, contents: contents}); },
    insertMetadataToDB,
    function (obj, cb) { cb(null, obj.metadata.slug); },
    makeDirectoryFromSlug,
    function (dir, cb) {
      cb(null, path.join(dir, './index.json'), {
        metadata: metadata,
        contents: contents
      });
    },
    writeContentsToFile
  ], function (err, obj) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Problem(obj));
    }
  });
};

//#endregion - static functions


// module.exports = Problem;
