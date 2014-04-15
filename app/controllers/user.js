/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';
var User = require('../models/user');

function Controller() {
  return undefined;
}

// 로그인이 필요한 경우
Controller.requireAuthentication = function (req, res, next) {
  if (req.session && req.session.user) {
    //@TODO 유효한 유저인지 검사
    next();
  } else {
    //@TODO 세션이 없을 경우엔 로그인 페이지로 이동
    next();
  }
};

// 관리자 권한이 필요한 경우
Controller.requireAdministratorAuthentication = function (req, res, next) {
  if (req.session && req.session.user) {
    //@TODO 관리자 권한 검사 루틴 추가
    next();
  } else {
    //@TODO 세션이 없을 경우엔 로그인 페이지로 이동
    next();
  }
};

// 유저 정보를 불러와 사용할수 있도록 req 변수에 추가합니다.
Controller.loadById = function (req, res, next) {
  if (req.params && req.params.userid) {
    var userId = req.params.userid;
    User.loadById(userId, function (err, user) {
      if (err) {
        next(err);
      } else {
        req.user = user;
        next();
      }
    });

  } else {
    next();
  }
};

Controller.signUp = function (req, res, next) {
  if (req.body && req.body.user) {
    //@TODO: 회원 가입 루틴이 추가되어야 함.
    next();
  } else {
    next();
  }
};

module.exports = Controller;
