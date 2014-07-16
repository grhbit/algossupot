'use strict';

exports.join = function (req, res, next) {
  res.render('partials/auth-join');
};

exports.login = function (req, res, next) {
  res.render('partials/auth-login');
};
