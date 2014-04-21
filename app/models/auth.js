/*jslint node: true, eqeq: true */
/*global alog, async, db*/
'use strict';

var table_name = 'auth';
var crypto = require('crypto');
var encryption_algorithm = 'sha1';
var encryption_key = 'this is algossupot encryption key';

var encrypt = function (plainText) {
  var hmacer = crypto.createHmac(encryption_algorithm, encryption_key)
    .update(plainText).digest('hex');

  return hmacer;
};

var _Auth, ClassMethods = {};
ClassMethods.signUp = function (name, password, callback) {
  var PasswordRegex = /^[a-z0-9_\-]{6,18}$/,
    checkNotExists = function (cb) {
      _Auth.find({where: {name: name}})
        .success(function (auth) {
          if (auth) {
            return cb('already registed user');
          }
          return cb(null);
        })
        .error(function (err) {
          return cb(err);
        });
    },
    encryptPassword = function (cb) {
      if (PasswordRegex.test(password)) {
        return cb(null, encrypt(password));
      }

      return cb('invalid password');
    },
    insertAuthInfo = function (encryptedPassword, cb) {
      _Auth.create({
        name: name,
        password: encryptedPassword
      })
        .success(function (auth) {
          cb(null, auth);
        })
        .error(function (err) {
          cb(err);
        });
    },
    insertToUserTable = function (auth, cb) {
      require('../models').User.create({
        name: auth.name
      })
        .success(function (user) {
          cb(null, user);
        })
        .error(function (err) {
          cb(err);
        });
    };

  async.waterfall([
    checkNotExists,
    encryptPassword,
    insertAuthInfo,
    insertToUserTable
  ], function (err, auth) {
    if (err) {
      return callback(err);
    }
    return callback(null, auth);
  });
};

ClassMethods.signIn = function (name, password, callback) {
  var PasswordRegex = /^[a-z0-9_\-]{6,18}$/,
    encryptPassword = function (cb) {
      if (PasswordRegex.test(password)) {
        return cb(null, encrypt(password));
      }

      return cb('invalid password');
    },
    comparePassword = function (encryptedPassword, cb) {
      _Auth.find({
        where: {
          name: name,
          password: encryptedPassword
        }
      })
        .success(function (auth) {
          if (auth) {
            return cb(null, auth);
          }
          return cb('not found user or not matching password.');
        })
        .error(function (err) {
          return cb(err);
        });
    };

  async.waterfall([
    encryptPassword,
    comparePassword
  ], function (err, auth) {
    if (err) {
      return callback(err);
    }
    return callback(null, auth);
  });
};

module.exports = function (sequelize, DataTypes) {
  var Auth = sequelize.define('Auth', {
    name: {
      type: DataTypes.STRING,
      validate: {is: ['^[a-z0-9_\\-]{3,32}$']}
    },
    password: DataTypes.STRING,
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValud: false
    }
  }, {
    associate: function (models) {
      Auth.belongsTo(models.User);
    },
    classMethods: ClassMethods
  });

  _Auth = Auth;

  return Auth;
};
