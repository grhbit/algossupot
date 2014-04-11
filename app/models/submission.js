/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';

var Query = {
  findById: 'SELECT * FROM algossupot.submission WHERE id=:id LIMIT 1;',
  getRecent: '',
  pushSubmit:
    'INSERT INTO `algossupot`.`submission` (`problemId`, `userId`, `language`, `state`, `codeLength`, `timestamp`) SELECT :problemId, :userId, :language, :state, :codeLength, :timestamp FROM DUAL WHERE EXISTS (SELECT * FROM `algossupot`.`user` WHERE id = :userId);'
};

function Submission() {
  this.id = null;
  this.problemId = null;
  this.userId = null;
  this.language = null;
  this.state = null;
  this.codeLength = null;
  this.timestamp = null;
}

Submission.prototype.isValid = function () {
  return this.problemId != null ||
    this.userId != null ||
    this.language != null ||
    this.state != null ||
    this.codeLength != null ||
    this.timestamp != null;
};

Submission.prototype.loadById = function (id, cb) {
  var self = this;
  sqlClient.query(Query.findById, {id: id})
    .on('result', function (res) {
      res.on('row', function (row) {
        self.id = row.id;
        self.problemId = row.problemId;
        self.userId = row.userId;
        self.language = row.language;
        self.state = row.state;
        self.codeLength = row.codeLength;
        self.timestamp = row.timestamp;
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        if (info.numRows === 0) {
          cb('not found submission#' + id);
        } else {
          cb();
        }
      });
    })
    .on('end', function () {
      return undefined;
    });
};

Submission.prototype.submit = function (cb) {
  var self = this;
  if (self.id !== null) {
    alog.error('Submission id must be null to submit');
  } else {
    if (!self.isValid()) {
      cb('Submission is invalid');
    }

    alog.info('Submission.submit');
    sqlClient.query(Query.pushSubmit, self)
      .on('result', function (res) {
        res.on('row', function (row) {
          alog.info(row);
        }).on('error', function (err) {
          alog.error(err);
          cb(err);
        }).on('end', function (info) {
          alog.info(info);
          self.id = info.insertId;
          cb();
        });
      });
  }
};

module.exports = Submission;
