'use strict';

exports.index = function (req, res) {
  res.render('index');
};

module.exports.api = require('./api');
module.exports.auth = require('./auth');
module.exports.user = require('./user');
module.exports.problem = require('./problem');
module.exports.submission = require('./submission');
