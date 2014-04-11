/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';

var Query = {
  findById: 'SELECT * FROM `algossupot`.`problem` WHERE id=:id LIMIT 1;',
  insert: ''
};

function Problem() {
  this.id = null;
  this.title = null;
  this.content = null;
}

Problem.prototype.isValid = function () {
  return this.title != null ||
    this.content != null;
};

Problem.prototype.loadById = function (id, cb) {
  var self = this;
  sqlClient.query(Query.findById, {id: id})
    .on('result', function (res) {
      res.on('row', function (row) {
        self.id = row.id;
        self.title = row.title;
        self.content = row.content;
        alog.info(row);
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        if (info.numRows === 0) {
          cb('not found problem#' + id);
        } else {
          cb();
        }
      });
    });
};

Problem.prototype.submit = function (cb) {
  var self = this;

  if (self.id !== null) {
    alog.error('Problem id must be null to submit');
  } else {
    if (!self.isValid()) {
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
