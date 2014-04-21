/*jslint node: true, eqeq: true */
/*global alog, async, db*/
'use strict';

var _User, ClassMethods = {};

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING(32),
      validate: {is: ['^[a-z0-9_\\-]{3,32}$', 'i']}
    },
    email: {
      type: DataTypes.STRING
    }
  }, {
    associate: function (models) {
      User
        .hasOne(models.Auth)
        .hasMany(models.Submission)
        .hasMany(models.Problem);
    }
  });

  _User = User;

  return User;
};
