/*jslint node: true, eqeq: true */
/*global alog*/
'use strict';
var Auth = require('../models').Auth;

function Controller() {
  return undefined;
}

// 로그인이 필요한 경우
Controller.requireAuthentication = function (req, res, next) {
  if (req.session && req.session.auth) {
    return next();
  }
  //세션이 없을 경우엔 처음으로 이동
  return res.redirect('/');
};

// 관리자 권한이 필요한 경우
Controller.requireAdministratorAuthentication = function (req, res, next) {
  if (req.session && req.session.auth && (req.session.auth.isAdmin === true)) {
    return next();
  }
  //세션이 없을 경우엔 처음으로 이동
  return res.redirect('/');
};

Controller.signIn = function (req, res) {
  var userid = req.body.userid,
    password = req.body.password;

  Auth.signIn(userid, password, function (err, auth) {
    if (err) {
      alog.error(err);
      return res.redirect('/');
    }

    req.session.auth = auth;

    //@HACK: 임시로 user에 auth를 넣어줌
    req.session.user = auth;
    return res.redirect('/');
  });
};

Controller.signOut = function (req, res) {
  req.session.destroy();
  res.redirect('/');
};

Controller.signUp = function (req, res) {
  res.render('auth/signup');
};

Controller.signUp_recvData = function (req, res) {
  var userid = req.body.userid,
    password = req.body.password;

  Auth.signUp(userid, password, function (err, auth) {
    if (err) {
      alog.error('signup fail!');
      alog.error(err);
      res.redirect('/');
    } else {
      res.redirect('/');
    }
  });
};

module.exports = Controller;
