/*jslint node: true, eqeq: true */
/*global alog*/
'use strict';
var Auth = require('../models').Auth;

function Controller() {
  return undefined;
}

Controller.signIn = function (req, res, next) {
  var userid = req.body.userid,
    password = req.body.password;

  Auth.signIn(userid, password, function (err, auth) {
    if (err) {
      alog.error(err);
      res.redirect('/');
      res.end();
    } else {
      req.session.user = auth;
      res.redirect('/');
      res.end();
    }
  });
};

Controller.signOut = function (req, res, next) {
  req.session.destroy();
  res.redirect('/');
};

Controller.signUp = function (req, res, next) {
  res.render('auth/signup');
};

Controller.signUp_recvData = function (req, res, next) {
  var userid = req.body.userid,
    password = req.body.password;

  Auth.signUp(userid, password, function (err, auth) {
    if (err) {
      alog.error('signup fail!');
      alog.error(err);
      res.redirect('/');
      res.end();

    } else {
      res.redirect('/');
      res.end();

    }
  });
};

module.exports = Controller;
