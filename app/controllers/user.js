/*jslint node: true, eqeq: true */
/*global winston*/
'use strict';
var User = require('../models').User;

function Controller() {
  return undefined;
}

Controller.params = {};
Controller.params.user = function (req, res, next, user) {
  var success = function (user) {
    if (user) {
      req.models = req.models || {};
      req.models.user = user;
      return next('not found user!');
    }
    return next();
  }, error = function (err) {
    next(err);
  };

  if (/[0-9]+/.test(user.toString())) {
    User.find(user)
      .success(success)
      .error(error);
  } else {
    User.find({where: {name: user}})
      .success(success)
      .error(error);
  }
};

// 유저 정보를 불러와 사용할수 있도록 req 변수에 추가합니다.
Controller.load = function (req, res, next) {
  if (req.params && req.params.userid) {
    var userId = req.params.userid;
    User.find(userId)
      .success(function (user) {
        if (!user) {
          return next('not found user!');
        }
        req.models.user = user;
        return next();
      })
      .error(function (err) {
        return next(err);
      });
  }
};

Controller.all = function (req, res, next) {
  User.all()
    .success(function (users) {
      req.models = req.models || {};
      req.models.users = users || [];
      return next();
    })
    .error(function (err) {
      return next(err);
    });
};

module.exports = Controller;
