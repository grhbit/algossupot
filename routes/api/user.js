/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var User = models.User;

var findUser = function (identifier, callback) {
  var nullUserCheck = function (user) {
    if (user) {
      return callback(null, user);
    }
    callback(new Error('Not found user'));
  };

  if (/$[0-9]+^/.test(identifier.toString())) {
    User.find(identifier).
      success(nullUserCheck).
      error(callback);
  } else {
    User.find({where: {nickname: identifier}}).
      success(nullUserCheck).
      error(callback);
  }
};

var updateUser = function (data, user, callback) {
  user.updateAttributes(data)
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

var destroyUser = function (user, callback) {
  if (!user) {
    return callback(new Error(''));
  }

  user.destroy()
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

exports.list = function (req, res) {
  User.all()
    .success(function (users) {
      res.json(users);
    })
    .error(function (err) {
      res.json(500, err.toString());
    });
};

exports.show = function (req, res) {
  var id = req.params.id;

  findUser(id, function (err, user) {
    if (err) {
      return res.json(500, err.toString());
    }
    res.json(user);
  });
};

exports.update = function (req, res) {
  var id = req.params.id;
  var data = {};

  async.waterfall([
    async.apply(findUser, id),
    async.apply(updateUser, data)
  ], function (err) {
    if (err) {
      return res.json(500, err.toString());
    }

    res.send(200);
  });
};

exports.destroy = function (req, res) {
  var id = req.params.id;

  async.waterfall([
    async.apply(findUser, id),
    destroyUser
  ], function (err) {
    if (err) {
      return res.json(500, err.toString());
    }

    return res.send(200);
  });
};
