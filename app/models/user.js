/*jslint node: true, eqeq: true */
/*global winston, async, config, db*/
'use strict';

var _User, ClassMethods = {};

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        is: ['^[a-z0-9_\\-]{3,32}$', 'i'],
        not: ['^[0-9]*$']
      }
    },
    /*
    nickname: {
      type: DataTypes.STRING(16),
      allowNull: false,
      validate: {is: ['^[a-z0-9_\\-ㄱ-ㅎㅏ-ㅣ가-힣]$', 'i']}
    },
    */
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
