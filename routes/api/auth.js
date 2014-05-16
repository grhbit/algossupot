/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var Auth = models.Auth;

exports.checkAuth = function (req, res, next) {
  if (req.session && req.session.auth) {
    next();
  } else {
    res.json(500, new Error(''));
  }
};

exports.checkAdminAuth = function (req, res, next) {
  if (req.session && req.session.auth && (req.session.auth.isAdmin === true)) {
    next();
  } else {
    res.json(500, new Error(''));
  }
};

exports.join = function (req, res, next) {
  var signUpForm = {
    username: req.body.username,
    nickname: req.body.nickname,
    password: req.body.password,
    email: req.body.email
  };
  Auth.signUp(signUpForm, function (err, auth) {
    if (err) {
      return res.json(500, err.toString());
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
      return res.json(500, err.toString());
    }


    auth.password = undefined;
    delete auth.password;

    req.session.auth = auth;

    return res.json(auth);
  });
};

exports.logout = function (req, res, next) {
  if (req.session) {
    req.session.destroy();
    res.json(200);
  } else {
    res.json(500, new Error('Not Found Session.').toString());
  }
};
