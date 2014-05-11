'use strict';

exports.list = function (req, res, next) {
  res.render('partials/user-list');
};

exports.show = function (req, res, next) {
  res.render('partials/user-show');
};
