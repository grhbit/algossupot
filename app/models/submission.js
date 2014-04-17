/*jslint node: true, eqeq: true */
/*global alog, db*/
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

Submission.loadById = function (id, cb) {
  alog.info('Submission.loadById#' + id);
  db.select()
    .where({id: id})
    .limit(1)
    .get('submission', function (err, results, fields) {
      if (err) {
        cb(err);
      } else {
        if (results.length !== 0) {
          cb(null, new Submission(results[0]));
        } else {
          cb('not found submission#' + id);
        }
      }
    });
};

Submission.submit = function (submission, cb) {
  db.insert('submission', {
    problemId: submission.problemId,
    userId: submission.userId,
    language: submission.language,
    state: submission.state,
    codeLength: submission.codeLength,
    timestamp: submission.timestamp
  }, function (err, info) {
    if (err) {
      cb(err);
    } else {
      cb(null, info);
    }
  });
};

Submission.prototype.submit = function (cb) {
  Submission.submit(this, cb);
};

Submission.prototype.changeState = function (state, cb) {
  db.update('submission', {
    state: state
  }, function (err) {
    if (err) {
      cb(err);
    } else {
      cb();
    }
  });
};

module.exports = Submission;
