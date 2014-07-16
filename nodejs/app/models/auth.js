/*jslint node: true, eqeq: true, vars: true */
/*global winston, async, models*/
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
ClassMethods.signUp = function (signUpForm, callback) {
  var User = models.User;
  var sequelize = models.sequelize;
  var PasswordRegex = /^[a-z0-9_\-]{6,18}$/,
    checkNotExists = function (cb) {
      _Auth.find({
        where: models.Sequelize.or(
          { username: signUpForm.username },
          { email: signUpForm.email }
        )
      }).
        success(function (auth) {
          if (auth) {
            return cb(new Error('already registed user'));
          }
          return cb(null);
        }).
        error(function (err) {
          return cb(err);
        });
    },
    encryptPassword = function (cb) {
      if (PasswordRegex.test(signUpForm.password)) {
        return cb(null, encrypt(signUpForm.password));
      }

      return cb(new Error('invalid password'));
    },
    buildingInstance = function (encryptedPassword, cb) {
      var buildingAuth = function (cb) {
        var auth = _Auth.build({
          username: signUpForm.username,
          email: signUpForm.email,
          password: encryptedPassword
        });

        cb(null, auth);
      };
      var buildingUser = function (cb) {
        var user = User.build({
          nickname: signUpForm.nickname
        });

        cb(null, user);
      };

      async.series({
        auth: buildingAuth,
        user: buildingUser
      }, function (err, results) {
        if (err) {
          return cb(err);
        }
        cb(null, results);
      });
    },
    insertToTable = function (data, cb) {
      sequelize.transaction(function (t) {
        var saveUser = function (cb) {
          data.user.save({transaction: t}).
            success(function () {
              cb(null);
            }).
            error(function (err) {
              cb(err);
            });
        };
        var saveAuth = function (cb) {
          data.auth.save({transaction: t}).
            success(function () {
              cb(null);
            }).
            error(function (err) {
              cb(err);
            });
        };
        var setUserAssociate = function (cb) {
          data.user.setAuth(data.auth, {transaction: t}).
            success(function () {
              cb(null);
            }).
            error(function (err) {
              cb(err);
            });
        };

        async.waterfall([
          saveUser, saveAuth, setUserAssociate
        ], function (err) {
          if (err) {
            return t.rollback().success(function () {
              cb(err);
            });
          }
          return t.commit().success(function () {
            cb(null, data);
          });
        });
      });
    };

  async.waterfall([
    checkNotExists,
    encryptPassword,
    buildingInstance,
    insertToTable
  ], function (err, data) {
    if (err) {
      return callback(err);
    }
    data.auth.values.user = data.user;
    return callback(null, data.auth);
  });
};

ClassMethods.signIn = function (signInForm, callback) {
  var User = models.User;
  var PasswordRegex = /^[a-z0-9_\-]{6,18}$/,
    encryptPassword = function (cb) {
      if (PasswordRegex.test(signInForm.password)) {
        return cb(null, encrypt(signInForm.password));
      }

      return cb(new Error('invalid password'));
    },
    comparePassword = function (encryptedPassword, cb) {
      _Auth.find({
        where: {
          username: signInForm.username,
          password: encryptedPassword
        },
        include: [ User ]
      }).
        success(function (auth) {
          if (auth && auth.user) {
            return cb(null, auth);
          }
          return cb(new Error('not found user or not matching password.'));
        }).
        error(function (err) {
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
    username: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        is: ['^[a-z0-9_\\-]+$'],
        len: [3, 32]
      }
    },
    password: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: {isEmail: true}
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
