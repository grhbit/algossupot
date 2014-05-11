/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var Auth = models.Auth;

exports.join = function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  Auth.signUp(username, password, function (err, auth) {
    if (err) {
      console.error(err);
      return res.json({ status: 500, message: err.toString() });
    }
    return res.json({ status: 200 });
  });
};

exports.login = function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  Auth.signIn(username, password, function (err, auth) {
    if (err) {
      return res.json({ status: 500 });
    }
    return res.json({ status: 200 });
  });
};
