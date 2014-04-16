/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';
var User = require('../models/auth');

function Controller() {
  return undefined;
}

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
