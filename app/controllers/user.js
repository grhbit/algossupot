/*jslint node: true, eqeq: true */
/*global alog*/
'use strict';
var User = require('../models').User;

function Controller() {
  return undefined;
}

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

module.exports = Controller;
