/*jslint node: true, eqeq: true */
/*global sqlClient, sqlQuery, alog*/
'use strict';

var Problem = require('./problem'),
  Submission = require('./submission'),
  User = require('./user');

exports.loadSubmissionsByIds = function (ids, cb) {
  var submissions = [];

  alog.info('loadSubmissionsByIds#' + JSON.stringify(ids));
  sqlClient.query(sqlQuery.Submission.Static.loadByIds, {ids: ids})
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        var submission = new Submission();
        submission.problemId = this.problemId;
        submission.userId = this.userId;
        submission.language = this.language;
        submission.state = this.state;
        submission.codeLength = this.codeLength;
        submission.timestamp = this.timestamp;

        submissions.push(row);
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        cb(null, submissions);
      });
    });
};
