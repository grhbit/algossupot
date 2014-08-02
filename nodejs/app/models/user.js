/*jslint node: true, eqeq: true */
/*global winston, async, config, db*/
'use strict';

var join = require('path').join;
var _User, ClassMethods = {}, InstanceMethods = {};

InstanceMethods.getSubmissionPath = function () {
  var self = this;
  return join(config.dir.submission, self.id.toString());
};

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
    },
    classMethods: ClassMethods,
    instanceMethods: InstanceMethods
  });

  _User = User;

  return User;
};
