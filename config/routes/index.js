/*jslint node: true, eqeq: true */
/*global alog, async, db*/
'use strict';
var Auth = require('../../app/models').Auth;
var User = require('../../app/models').User;
var Problem = require('../../app/models').Problem;
var Submission = require('../../app/models').Submission;
var UserController = require('../../app/controllers/user');
var AuthController = require('../../app/controllers/auth');
var ProblemController = require('../../app/controllers/problem');
var SubmissionController = require('../../app/controllers/submission');

var marked = require('marked');
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

var index = function (req, res) {
  res.render('user_dashboard', { is_signed_in: req.session.user != null });
};

// For tests.
var routes = {

  index: function (req, res) {

    if (req.session && req.session.user) {
      async.waterfall([
        function (cb) {
          Submission.findAll({
            include: [{
              model: User,
              where: {id: req.session.user.id}
            }, Problem]
          }).success(function (submissions) {
            cb(null, submissions);
          }).error(function (err) {
            cb(err);
          });
        },
        function (results, cb) {
          var submitted = [];
          async.each(results, function (result, next) {
            submitted.push({
              num: result.problem.id,
              title: result.problem.name,
              status: result.state,
              submission_id: result.id,
              code: ''
            });
            next();
          }, function (err) {
            cb(null, submitted);
          });
        }
      ], function (err, submitted) {
        res.render('user_dashboard', {
          user: req.session.user,
          rows: submitted || [],
          is_signed_in: true
        });
      });
    } else {
      res.render('default_template', { is_signed_in: false });
    }
  },
  users: {
    index: {
      get: function (req, res) {
        res.end();
      },
      post: function (req, res) {
        res.end();
      }
    },
  },
  problems: {
    id: {
      submit: {
        post: function (req, res) {
          var src = req.body['source-code-form'];

          alog.info(req.session.user);
          User.find(req.session.user.id).success(function (user) {
            if (!user) {
              return res.redirect('/');
            }

            alog.info(user);

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
        }
      }
    }
  }
};

exports.use = function (app) {
  app.all('/', routes.index);

  app.get('/users', routes.users.index.get);
  app.post('/users', routes.users.index.post);

  app.get('/problems', ProblemController.renderProblemList);
  app.get('/problems/:problemid', ProblemController.load, ProblemController.renderProblemPage);
  app.post('/problems/:problemid/submit', AuthController.requireAuthentication, ProblemController.recvSubmit);

  app.get('/submission/:submission_id/view-source', SubmissionController.loadWithSourceCode, function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    res.end(req.models.submission.sourceCode);
  });

  app.get('/admin/problem', function (req, res) {
    res.render('admin/problem');
  });

  app.post('/auth/signin', AuthController.signIn);
  app.post('/auth/signout', AuthController.signOut);
  app.get('/auth/signup', AuthController.signUp);
  app.post('/auth/signup/recv', AuthController.signUp_recvData);
};
