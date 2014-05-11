/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
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

var findById = function (id, callback) {
  Problem.find(id)
    .success(function (problem) {
      callback(null, problem);
    })
    .error(function (err) {
      callback(err);
    });
};

var updateProblem = function (data, problem, callback) {
  problem.updateAttributes(data)
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

var destroyProblem = function (problem, callback) {
  if (!problem) {
    return callback(new Error(''));
  }

  problem.destroy()
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
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

exports.list = function (req, res) {
  Problem.all()
    .success(function (problems) {
      res.json({ status: 200, problems: problems });
    })
    .error(function (err) {
      res.json({ status: 500, message: err.toString() });
    });
};

exports.new = function (req, res) {
  return undefined;
};

exports.show = function (req, res) {
  var id = req.params.id;

  findById(id, function (err, problem) {
    loadContents(problem, function (err, contents) {
      if (err) {
        return res.json({ status: 500, message: err.toString() });
      }

      contents.problem_content = marked(String(contents.problem_content));
      return res.json({ status: 200, problem: problem, contents: contents });
    });
  });
};

exports.create = function (req, res) {
  return undefined;
};

exports.update = function (req, res) {
  var id = req.params.id;
  var data = {};

  async.waterfall([
    async.apply(findById, id),
    async.apply(updateProblem, data)
  ], function (err) {
    if (err) {
      return res.json({ status: 500, message: err.toString() });
    }

    res.json({ status: 200 });
  });
};

exports.destroy = function (req, res) {
  var id = req.params.id;

  async.waterfall([
    async.apply(findById, id),
    destroyProblem
  ], function (err) {
    if (err) {
      return res.json({ status: 500, message: err.toString() });
    }

    return res.json({ status: 200 });
  });
};
