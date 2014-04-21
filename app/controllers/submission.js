/*jslint node: true, eqeq: true */
/*global alog, async, config*/
'use strict';
var models = require('../models');
var Submission = models.Submission;
var User = models.User;
var Problem = models.Problem;

function Controller() {
  return undefined;
}

Controller.load = function (req, res, next) {
  if (req.params && req.params.submission_id) {
    var id = req.params.submission_id;
    Submission.find(id)
      .success(function (submission) {
        if (!submission) {
          return next('not found submission');
        }

        req.models = req.models || {};
        req.models.submission = submission;
        return next();
      })
      .error(function (err) {
        return next(err);
      });
  } else {
    return next('wrong request');
  }
};

Controller.loadWithSourceCode = function (req, res, next) {
  if (req.params && req.params.submission_id) {
    var id = req.params.submission_id;

    Submission.find({where: {'id': id}})
      .success(function (submission) {
        if (!submission) {
          return next('not found submission');
        }

        req.models = req.models || {};
        req.models.submission = submission;
        submission.loadSourceCode(function (err, sourceCode) {
          req.models.submission.sourceCode = sourceCode;
          if (err) {
            return next(err);
          }
          return next();
        });
      })
      .error(function (err) {
        return next(err);
      });
  } else {
    return next('wrong request');
  }
};

module.exports = Controller;
