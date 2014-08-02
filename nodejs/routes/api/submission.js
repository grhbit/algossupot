/*jslint node: true, eqeq: true */
/*global async, models, winston*/
'use strict';

var User = models.User;
var Problem = models.Problem;
var Submission = models.Submission;

var findSubmissionById = function (id, callback) {
  if (id) {
    Submission.find(id).
      success(function (submission) {
        if (submission) {
          return callback(null, submission);
        }
        callback(new Error('Not found submission:' + id));
      }).error(callback);
  } else {
    callback(new Error('Bad Request'));
  }
};

exports.list = (function () {
  return function (req, res) {
    Submission.all()
      .success(function (submissions) {
        res.json(submissions);
      })
      .error(function (err) {
        res.json(500, err.toString());
      });
  };
}());

exports.show = (function () {
  return function (req, res) {
    if (!(req.params && req.params.id)) {
      return res.json(500, (new Error('Bad Request')).toString());
    }

    var id = req.params.id;

    findSubmissionById(id, function (err, submission) {
      async.series({
        submission: function (cb) { cb(err, submission); },
        sourceCode: function (cb) { submission.loadSourceCode(cb); },
        errorMessage: function (cb) {
          submission.loadErrorMessage(function (err, result) {
            cb(null, result);
          });
        }
      }, function (err, results) {
        if (err) {
          console.log(err.toString());
          return res.json(500, err.toString());
        }

        results.sourceCode = String(results.sourceCode || '');
        results.errorMessage = String(results.errorMessage || '');

        res.json(results);
      });
    });
  };
}());

exports.create = (function () {
  var findProblem = function (req, cb) {
    if (req.body && req.body.problemId) {
      var problemId = req.body.problemId;
      Problem.find(problemId).
        success(function (problem) {
          if (problem) {
            return cb(null, problem);
          }
          cb(new Error('Not found problem:' + problemId));
        }).error(cb);
    } else {
      cb(new Error('Bad Request'));
    }
  }, findUser = function (req, cb) {
    if (req.session && req.session.auth && req.session.auth.UserId) {
      var userId = req.session.auth.UserId;
      User.find(userId).
        success(function (user) {
          if (user) {
            return cb(null, user);
          }
          cb(new Error('Not found user :' + userId));
        }).error(cb);
    } else {
      cb(new Error('Bad Request'));
    }
  }, getSubmissionData = function (req, cb) {
    if (req.body && req.body.submission &&
        req.body.submission.language && req.body.submission.sourceCode) {
      return cb(null, {
        language: req.body.submission.language,
        sourceCode: req.body.submission.sourceCode
      });
    }
    cb(new Error('Bad Request'));
  };

  return function (req, res) {
    async.series({
      user: async.apply(findUser, req),
      problem: async.apply(findProblem, req),
      submissionData: async.apply(getSubmissionData, req)
    }, function (err, results) {
      if (err) {
        return res.json(500, err.toString());
      }

      Submission.push(results, function (err) {
        if (err) {
          return res.json(500, err.toString());
        }
        res.send(200);
      });
    });
  };
}());

exports.destroy = (function () {
  var destroySubmission = function (submission, cb) {
    //TODO: removes (source code, error files).
    submission.destroy().complete(cb);
  };

  return function (req, res) {
    var id = req.params.id;

    async.waterfall([
      async.apply(findSubmissionById, id),
      destroySubmission
    ], function (err) {
      if (err) {
        return res.json(500, err.toString());
      }
      res.send(200);
    });
  };
}());
