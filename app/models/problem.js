/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';

var Query = {
  findById: 'SELECT * FROM `algossupot`.`problem` WHERE id=:id LIMIT 1;',
  insert: 'INSERT INTO `algossupot`.`problem` (`title`, `content`) SELECT :title, :content FROM DUAL WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`problem` WHERE title = :title ) ;'
}, Regex = {
  name: /^[A-Za-z\-]{1,32}$/
};

function Problem(params) {
  params = params || {};

  this.id = params.id;
  this.name = params.name;
}

//#region - static functions

Problem.validating = function (problem) {
  return problem.title != null && Regex.name.test(problem.name);
};

Problem.loadById = function (id, cb) {
  alog.info('Problem.loadById#' + id);
  sqlClient.query(Query.findById, {id: id})
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        var problem = new Problem(row);
        cb(null, problem);
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        if (info.numRows === 0) {
          cb('not found problem#' + id);
        }
      });
    });
};

Problem.regist = function (problem, content) {
};

//#endregion - static functions

Problem.prototype.validating = function () {
  return Problem.validating();
};

Problem.prototype.submit = function (cb) {
  var self = this;

  if (self.id !== null) {
    alog.error('Problem id must be null to submit');
    cb('Problem id must be null to submit');
  } else {
    if (!self.validating()) {
      cb('Problem is invalid');
    } else {
      alog.info('Problem.submit');
      sqlClient.query(Query.insert, self)
        .on('result', function (res) {
          res.on('row', function (row) {
            alog.info(row);
          }).on('error', function (err) {
            alog.error(err);
            cb(err);
          }).on('end', function (info) {
            alog.info(info);

            if (info.affectedRows === 0) {
              cb('Problem submit failed');
            } else {
              self.id = info.insertId;
              cb();
            }
          });
        });
    }
  }
};

module.exports = Problem;
