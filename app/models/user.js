/*jslint node: true, eqeq: true */
/*global alog, async, db*/
'use strict';

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      validate: {is: ['^[a-z0-9_\\-]{3,32}$', 'i']}
    },
    email: {
      type: DataTypes.STRING,
      validate: {is: ['^([a-z0-9_\\.\\-]+)@([\\da-z\\.\\-]+)\\.([a-z\\.]{2,6})$']}
    }
  }, {
    associate: function (models) {
      User.hasMany(models.Submission);
    }
  });

  User.sync();

  return User;
};
