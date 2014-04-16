/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';
var User = require('../../app/models/user');
var Problem = require('../../app/models/problem');
var Submission = require('../../app/models/submission');
var UserController = require('../../app/controllers/user');
var AuthController = require('../../app/controllers/auth');

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
    if (req.session.user) {
      var submitted = [];
      sqlClient.query('SELECT * FROM `algossupot`.`submission` WHERE `userId` = :userId;', { userId: req.session.user.id })
        .on('result', function (res) {
          res.on('row', function (row) {
            submitted.push({
              num: row.problemId,
              title: row.problemId,
              status: row.state,
              code: row.codeLength
            });
          });
        }).on('end', function (info) {
          res.render('user_dashboard', {
            user: req.session.user,
            rows: submitted,
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
    id: {
      get: function (req, res) {
        res.end();
      },
      post: function (req, res) {
        res.end();
      },
      put: function (req, res) {
        res.end();
      },
      del: function (req, res) {
        res.end();
      }
    }
  },
  submissions: {},
  problems: {
    index: {
      post: function (req, res) {
        var title = req.body.title,
          content = req.body.content,
          problem;

        problem = new Problem();
        problem.title = title;
        problem.content = content;

        problem.submit(function (err) {
          res.redirect('/');
        });
      }
    },
    id: {
      submit: {
        post: function (req, res) {
          var src = req.body['source-code-form'],
            submission = new Submission();

          submission.problemId = req.params.problemid;
          submission.userId = req.session.user.id;
          submission.language = 'C++';
          submission.state = 0;
          submission.codeLength = src.length;
          submission.timestamp = (Date.now() / 1000);

          submission.submit(function (err) {
            if (err) {
              res.redirect('/');
            } else {
              res.redirect('/');
            }
          });
        }
      },
      get: function (req, res) {
        var problemid = req.params.problemid,
          problem = new Problem();

        problem.loadById(problemid, function (err) {
          if (err) {
            res.redirect('/');
          } else {
            res.render('problem', {
              is_signed_in: req.session.user != null,
              user: req.session.user,
              problem_id: problem.id,
              problem_title: problem.title,
              problem_content: marked(problem.content)
            });
          }
        });
      }
    }
  },
  session: {
    new: {
      post: function (req, res) {
        if (req.session.user) {
          req.session.user.destroy();
          delete req.session.user;
        }

        User.signIn(req.body.name, req.body.password, function (err, user) {
          if (err) {
            delete req.session.user;
            res.redirect('/');
          } else {
            req.session.user = user;
            res.redirect('/');
          }
        });

      }
    },
    destroy: {
      post: function (req, res) {
        req.session.destroy();
        res.redirect('/');
      }
    }
  }
};

exports.use = function (app) {
  app.all('/', routes.index);

  app.get('/users', routes.users.index.get);
  app.post('/users', routes.users.index.post);

  app.get('/users/:userid', routes.users.id.get);
  app.post('/users/:userid', routes.users.id.post);
  app.put('/users/:userid', routes.users.id.put);
  app.del('/users/:userid', routes.users.id.del);

  app.post('/problems', routes.problems.index.post);
  app.get('/problems/:problemid', routes.problems.id.get);
  app.post('/problems/:problemid/submit', routes.problems.id.submit.post);

  app.get('/admin/problem', function (req, res) {
    res.render('admin/problem');
  });

  app.post('/session/new', routes.session.new.post);
  app.post('/session/destroy', routes.session.destroy.post);

  app.get('/auth/signup', AuthController.signUp);
  app.post('/auth/signup/recv', AuthController.signUp_recvData);
};
