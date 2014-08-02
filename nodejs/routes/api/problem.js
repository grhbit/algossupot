/*jslint node: true, eqeq: true, vars: true */
/*global _, async, models, winston*/
'use strict';

var marked = require('marked');
var Problem = models.Problem;

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

var findProblemById = function (id, callback) {
  if (id) {
    Problem.find(id).
      success(function (problem) {
        if (problem) {
          return callback(null, problem);
        }
        callback(new Error('Not found problem:' + id));
      }).error(callback);
  } else {
    callback(new Error('Bad Request'));
  }
};

var loadContents = function (problem, callback) {
  if (!problem) {
    return callback(new Error(''));
  }

  problem.loadContents(function (err, contents) {
    if (err) {
      return callback(err);
    }
    return callback(null, contents);
  });
};

exports.list = (function () {
  return function (req, res) {
    Problem.all().
      success(function (problems) {
        res.json(problems);
      }).
      error(function (err) {
        res.json(500, err.toString());
      });
  };
}());

exports.show = function (req, res) {
  var id = req.params.id;

  findProblemById(id, function (err, problem) {
    loadContents(problem, function (err, contents) {
      if (err) {
        return res.json(500, err);
      }

      contents.description = marked(String(contents.description));
      res.json({
        problem: problem,
        contents: contents
      });
    });
  });
};

exports.create = (function () {
  var User = models.User,
    findUser = function (req, cb) {
      if (req.session && req.session.auth && req.session.auth.UserId) {
        var userId = req.session.auth.UserId;
        User.find(userId)
          .success(function (user) {
            if (user) {
              return cb(null, user);
            }
            cb(new Error('Not found user:' + userId));
          })
          .error(cb);
      } else {
        cb(new Error('Bad Request'));
      }
    },
    getProblemData = function (req, cb) {
      if (req.body && req.body.problem) {
        var problem = req.body.problem;
        cb(null, problem);
      } else {
        cb(new Error('Bad Request'));
      }
    };

  return function (req, res) {
    async.series({
      user: async.apply(findUser, req),
      problemData: async.apply(getProblemData, req)
    }, function (err, results) {
      if (err) {
        return res.json(500, err.toString());
      }

      Problem.push(results, function (err) {
        if (err) {
          return res.json(500, err.toString());
        }
        res.send(200);
      });
    });
  };
}());

exports.update = (function () {
  return function (req, res) {
    var id = req.params.id;

    findProblemById(id, function (err, problem) {
      if (err) {
        return res.json(500, err.toString());
      }

      //TODO: update problem index and description files.

      res.send(200);
    });
  };
}());

exports.destroy = (function () {
  var destroyProblem = function (problem, cb) {
    //TODO: removes problem folder.
    problem.destroy().complete(cb);
  };

  return function (req, res) {
    var id = req.params.id;

    async.waterfall([
      async.apply(findProblemById, id),
      destroyProblem
    ], function (err) {
      if (err) {
        return res.json(500, err.toString());
      }

      return res.send(200);
    });
  };
}());
