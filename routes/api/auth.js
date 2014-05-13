/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var Auth = models.Auth;

exports.join = function (req, res, next) {
  var signUpForm = {
    username: req.body.username,
    nickname: req.body.nickname,
    password: req.body.password,
    email: req.body.email
  };
  Auth.signUp(signUpForm, function (err, auth) {
    if (err) {
      return res.json(500, { error: err.toString() });
    }

    auth.password = undefined;
    delete auth.password;
    return res.json(auth);
  });
};

exports.login = function (req, res, next) {
  var signInForm = {
    username: req.body.username,
    password: req.body.password
  };

  Auth.signIn(signInForm, function (err, auth) {
    if (err) {
      return res.json(500, { error: err.toString() });
    }

    auth.password = undefined;
    delete auth.password;
    return res.json(auth);
  });
};

exports.resign = function (req, res, next) {

};
