/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';
var User = require('../models/auth');

function Controller() {
  return undefined;
}


Controller.signIn = function (req, res, next) {
  var userid = req.body.userid,
    password = req.body.password;

  User.signIn(userid, password, function (err, user) {
    if (err) {
      alog.error(err);
      res.redirect('/');
      res.end();
    } else {
      req.session.user = user;
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
    // nickname = req.body.nickname,
    password = req.body.password;

  User.signUp(userid, password, function (err, info) {
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
