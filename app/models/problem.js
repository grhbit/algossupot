/*jslint node: true, eqeq: true */
/*global async, alog, config, db*/
'use strict';
var path = require('path'),
  fs = require('fs');

var Query = {
  findById: 'SELECT * FROM `algossupot`.`problem` WHERE id=:id LIMIT 1;',
  findBySlug: 'SELECT * FROM `algossupot`.`problem` WHERE slug=:slug LIMIT 1;',
  insert: 'INSERT INTO `algossupot`.`problem` (`title`, `content`) SELECT :title, :content FROM DUAL WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`problem` WHERE title = :title ) ;'
}, Regex = {
  metadata: {
    slug: /^[A-Za-z\- ]{1,32}$/,
    name: /^[A-Za-z\-ㄱ-ㅎㅏ-ㅣ가-힣 ]{1,32}$/, // 스페이스 ' ' 문자 추가
  },
  contents: { }
};

function Problem(params) {
  params = params || {};
  params.metadata = params.metadata || {};
  params.contents = params.contents || {};

  // DB에 저장
  this.metadata = {
    slug: params.metadata.slug || null,
    userId: params.metadata.userId || null,
    name: params.metadata.name || null
  };

  // 파일(index.json)으로 저장
  this.contents = {
    description: params.contents.description || null,
    input: params.contents.input || null,
    output: params.contents.output || null,
    sampleInput: params.contents.sampleInput || null,
    sampleOutput: params.contents.sampleOutput || null,
    note: params.contents.note || null,
    timeLimit: params.contents.timeLimit || null,
    memoryLimit: params.contents.memoryLimit || null
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
      metadata.slug == null || !Regex.metadata.slug.test(metadata.slug) ||
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
      var indexPath = path.join(config.dir.storage, './problems', metadata.slug, './index.json');

      fs.stat(indexPath, function (err, stats) {
        if (err) {
          callback(err);
        } else {
          fs.readFile(indexPath, function (err, data) {
            var problemInfo = JSON.parse(data);
            cb(null, metadata, problemInfo.contents);
          });
        }
      });
    },
  ], function (err, metadata, contents) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Problem({
        metadata: metadata,
        contents: contents
      }));
    }
  });
};

Problem.loadBySlug = function (slug, callback) {
  var indexPath = path.join(config.dir.storage, './problems', slug, './index.json');

  async.waterfall([
    function (cb) {
      cb(null, slug);
    },
    Problem.exists,
    function (exists, cb) {
      if (exists) {
        cb(null, indexPath);
      } else {
        cb('not found problem: slug#' + slug);
      }
    },
    fs.readFile,
    function (data, cb) {
      var json = JSON.parse(data);
      cb(null, new Problem({
        metadata: json.metadata,
        contents: json.contents
      }));
    }
  ], function (err, problem) {
    if (err) {
      alog.error(err);
      callback(err);
    } else {
      callback(null, problem);
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
  var slugDir = path.join(config.dir.storage, './problems', metadata.slug),
    indexPath = path.join(slugDir, './index.json');

  async.waterfall([
    function (cb) {
      cb(null, metadata.slug);
    },
    Problem.exists,
    function (exists, cb) {
      if (exists) {
        cb('already exists');
      } else {
        cb(null, slugDir);
      }
    },
    fs.mkdir,
    function (cb) {
      cb(null, indexPath, JSON.stringify({
        metadata: metadata,
        contents: contents
      }));
    },
    fs.writeFile,
    function (cb) {
      db.where({slug: metadata.slug})
        .limit(1)
        .count('problem', function (err, results, fields) {
          if (err) {
            cb(err);
          } else {
            if (results === 0) {
              cb();
            } else {
              cb('already exists problem\'s slug');
            }
          }
        });
    },
    function (cb) {
      db.insert('problem', {
        slug: metadata.slug,
        userId: metadata.userId,
        name: metadata.name
      }, function (err, info) {
        if (err) {
          cb(err);
        } else {
          cb();
        }
      });
    }
  ], function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null, new Problem({
        metadata: metadata,
        contents: contents
      }));
    }
  });
};

Problem.update = function (metadata, contents, callback) {
  async.waterfall([
    function (cb) {
      cb(null, metadata.slug);
    },
    Problem.exists,
    function (exists, cb) {
      if (!exists) {
        cb('not exists');
      } else {
        cb(null, path.join(config.dir.storage, './problems', metadata.slug, './index.json'));
      }
    },
    fs.exists,
    function (exists, cb) {
    },
    function (cb) {
      cb(null);
    }
  ], function (err) {
  });
};

// 문제를 갱신합니다. 없으면 생성 있으면 업데이트
Problem.commit = function (problem, cb) {
  var validation = problem.validating();
  if (validation.result) {
  } else {
    alog.error('invalid problem', validation);
    cb('invliad problem');
  }
};

//#endregion - static functions

module.exports = Problem;
