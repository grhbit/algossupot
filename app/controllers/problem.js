/*jslint node: true, eqeq: true */
/*global alog*/
'use strict';
var Problem = require('../models').Problem;
var marked = require('marked');

function Controller() {
  return undefined;
}

// 문제 데이터를 읽어 req 변수에 추가합니다.
Controller.loadById = function (req, res, next) {
  if (req.params && req.params.problemid) {
    var problemId = req.params.problemid;
    Problem.find(problemId).success(function (problem) {
      if (problem) {
        problem.loadContents(function (err, metadata) {
          if (err) {
            return next(err);
          }
          req.problem = { metadata: metadata };
          return res.render('problem', {
            is_signed_in: req.session.user != null,
            user: req.session.user,
            problem_id: problem.id,
            problem_title: metadata.name,
            problem_content: marked(String(metadata.problem_content))
          });
        });
      } else {
        next('not found problem');
      }
    }).error(function (err) {
      next(err);
    });

  } else {
    //@TODO 문제를 불러오기 위해 필요한 정보가 없는 경우엔 에러 발생
    next('wrong request');
  }
};

module.exports = Controller;
