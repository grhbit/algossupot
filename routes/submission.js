'use strict';

exports.list = function (req, res, next) {
  res.render('partials/submission-list');
};

exports.show = function (req, res, next) {
  res.render('partials/submission-show');
};

exports.create = function (req, res, next) {
  res.render('partials/submission-create');
};
