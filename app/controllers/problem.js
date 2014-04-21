/*jslint node: true, eqeq: true */
/*global alog, async*/
'use strict';
var Problem = require('../models').Problem;
var Submission = require('../models').Submission;
var User = require('../models').User;
var marked = require('marked');

function Controller() {
  return undefined;
}

// 문제 데이터를 읽어 req 변수에 추가합니다.
Controller.load = function (req, res, next) {
  if (req.params && req.params.problemid) {
    var problemId = req.params.problemid;
    Problem.find(problemId).success(function (problem) {
      if (!problem) {
        return next('not found problem');
      }

      req.models = req.models || {};
      req.models.problem = problem;
      problem.loadContents(function (err, metadata) {
        if (err) {
          return next(err);
        }
        req.models.problem.metadata = metadata;
        return next();
      });
    }).error(function (err) {
      return next(err);
    });

  } else {
    return next('wrong request');
  }
};

Controller.recvSubmit = function (req, res) {
  var src = req.body['source-code-form'];
  User.find(req.session.user.id).success(function (user) {
    if (!user) {
      return res.redirect('/');
    }

    Problem.find(req.params.problemid).success(function (problem) {
      if (!problem) {
        return res.redirect('/');
      }

      Submission.create({state: 0})
        .success(function (submission) {
          user.addSubmission(submission).success(function () {
            problem.addSubmission(submission).complete(function (err) {
              submission.saveSourceCode(src, function (err) {
                res.redirect('/');
              });
            });

          });
        })
        .error(function (err) {
          alog.error(err);
          res.redirect('/');
        });

    }).error(function (err) {
      alog.error(err);
      res.redirect('/');
    });
  }).error(function (err) {
    alog.error(err);
    res.redirect('/');
  });
};

Controller.renderProblemPage = function (req, res) {
  if (req.models.problem) {
    var problem = req.models.problem,
      metadata = problem.metadata;

    return res.render('problem', {
      is_signed_in: req.session.user != null,
      user: req.session.user,
      problem_id: problem.id,
      problem_title: metadata.name,
      problem_content: marked(String(metadata.problem_content))
    });
  }

  return res.end();
};

Controller.renderProblemList = function (req, res) {
  Problem.all()
    .success(function (problems) {
      return res.render('problem_list', {
        is_signed_in: req.session.user != null,
        problems: problems
      });
    })
    .error(function (err) {
      return res.redirect('/');
    });
};

module.exports = Controller;
