/*jslint node: true, eqeq: true */
/*global alog, async, config, db*/
'use strict';

var _Submission, ClassMethods = {}, InstanceMethods = {};

module.exports = function (sequelize, DataTypes) {
  var Submission = sequelize.define('Submission', {
    state: DataTypes.INTEGER
  }, {
    associate: function (models) {
      Submission
        .belongsTo(models.User)
        .belongsTo(models.Problem);
    }
  });

  _Submission = Submission;

  return Submission;
};

// module.exports = Submission;
