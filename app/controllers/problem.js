/*jslint node: true, eqeq: true */
/*global alog*/
'use strict';
var Problem = require('../models/problem');

function Controller() {
  return undefined;
}

// 문제 데이터를 읽어 req 변수에 추가합니다.
Controller.loadById = function (req, res, next) {
  if (req.params && req.params.problemid) {
    var problemId = req.params.problemid;
    Problem.loadById(problemId, function (err, problem) {
      if (err) {
        next(err);
      } else {
        req.problem = problem;
        next();
      }
    });

  } else {
    //@TODO 문제를 불러오기 위해 필요한 정보가 없는 경우엔 에러 발생
    next();
  }
};

module.exports = Controller;
