'use strict';

exports.list = function (req, res, next) {
  res.render('partials/problem-list');
};

exports.show = function (req, res, next) {
  res.render('partials/problem-show');
};
