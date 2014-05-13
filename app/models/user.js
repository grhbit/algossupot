/*jslint node: true, eqeq: true */
/*global winston, async, config, db*/
'use strict';

var _User, ClassMethods = {};

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    nickname: {
      type: DataTypes.STRING(16),
      notNull: true,
      validate: {is: ['^[a-z0-9_\\-ㄱ-ㅎㅏ-ㅣ가-힣]+$', 'i'], len: [2, 16]}
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
