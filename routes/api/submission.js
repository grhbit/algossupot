/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var User = models.User;
var Problem = models.Problem;
var Submission = models.Submission;

var findById = function (id, callback) {
  Submission.find(id)
    .success(function (submission) {
      callback(null, submission);
    })
    .error(function (err) {
      callback(err);
    });
};

var updateSubmission = function (data, submission, callback) {
  submission.updateAttributes(data)
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

var destroySubmission = function (submission, callback) {
  if (!submission) {
    return callback(new Error(''));
  }

  submission.destroy()
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

exports.list = function (req, res) {
  Submission.all()
    .success(function (submissions) {
      res.json(submissions);
    })
    .error(function (err) {
      res.json(500, err.toString());
    });
};

exports.new = function (req, res) {
  return undefined;
};

exports.show = function (req, res) {
  var id = req.params.id;

  findById(id, function (err, submission) {
    if (err) {
      return res.json(500, err.toString());
    }

    res.json(submission);
  });
};

exports.create = function (req, res) {
  if (!req.session || !req.session.user) {
    return res.json(500, (new Error('')).toString());
  }

  var findProblem = function (cb) {
    if (req.body && req.body.problemSlug) {
      Problem.find({where: {slug: req.body.problemSlug}}).
        success(function (problem) {
          if (problem) {
            cb(null, problem);
          } else {
            cb((new Error('Not found problem')));
          }
        }).
        error(function (err) {
          cb(err);
        });
    } else {
      return cb((new Error('Bad Request')));
    }
  };
  var findUser = function (cb) {
    if (req.session && req.session.user && req.session.user.id) {
      return cb(null, req.session.user);
    }
    return cb((new Error('Not found user')));
  };
  var submitSourceCode = function (results, cb) {
    if (req.body && req.body.language && req.body.sourceCode) {
      Submission.push({
        language: req.body.language,
        codeLength: req.body.sourceCode
      }, results.user.id, results.problem.id, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null);
      });
    } else {
      cb(new Error('Bad Request'));
    }
  };

  async.series({
    user: findUser,
    problem: findProblem
  }, function (err, results) {
    if (err) {
      return res.json(500, err);
    }

    submitSourceCode(results, function (err) {
      if (err) {
        return res.json(500, err);
      }
      res.send(200);
    });
  });
};

exports.update = function (req, res) {
  var id = req.params.id;
  var data = {};

  async.waterfall([
    async.apply(findById, id),
    async.apply(updateSubmission, data)
  ], function (err) {
    if (err) {
      return res.json(500, err);
    }

    res.json({});
  });
};

exports.destroy = function (req, res) {
  var id = req.params.id;

  async.waterfall([
    async.apply(findById, id),
    destroySubmission
  ], function (err) {
    if (err) {
      return res.json(500, err);
    }

    return res.json({});
  });
};
