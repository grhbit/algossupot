/*jslint node: true, eqeq: true */
/*global alog, async, db*/
'use strict';

var Query = {
  findById: 'SELECT * FROM `algossupot`.`user` WHERE id=:id LIMIT 1 ;',
  findByName: 'SELECT * FROM `algossupot`.`user` WHERE name=:name LIMIT 1 ;',
  signUp: 'INSERT INTO `algossupot`.`user` (name, email, password) SELECT :name, :email, :password FROM DUAL WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`user` WHERE name = :name ) ;',
  resign: 'DELETE FROM `algossupot`.`user` WHERE id = :id;',
  Static: {
    createTable: '',
    loadByIds: 'SELECT * FROM `algossupot`.`user` WHERE id IN(:ids) ;',
    loadByNames: 'SELECT * FROM `algossupot`.`user` WHERE name IN(:names) ;'
  }

}, Regex = {
  name: /^[a-z0-9_\-]{3,32}$/,
  email: /^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/,
  password: /^[a-z0-9_\-]{6,18}$/
};

function User(params) {
  params = params || {};

  this.id = params.id;
  this.name = params.name;
  this.email = params.email;
}

//#region - static functions

User.loadById = function (id, cb) {
  alog.info('User.loadById#' + id);

  async.select()
    .where({id: id})
    .limit(1)
    .get('user', function (err, results, fields) {
      if (err) {
        cb(err);
      } else {
        if (results.length === 0) {
          cb(null, null);
        } else {
          cb(null, new User(results[0]));
        }
      }
    });
};

User.loadByName = function (name, cb) {
  alog.info('User.loadById#' + name);
  db.select()
    .where({name: name})
    .limit(1)
    .get('user', function (err, results, fields) {
      if (err) {
        cb(err);
      } else if (results.length === 0) {
        cb(null, null);
      } else {
        cb(null, new User(results[0]));
      }
    });
};

User.loadByIds = function (ids, callback) {
  alog.info('loadByIds#' + JSON.stringify(ids));

  async.waterfall([
    function (cb) {
      db.select()
        .where('id', ids)
        .get('user', function (err, results, fields) {
          if (err) {
            cb(err);
          } else {
            cb(null, results);
          }
        });
    },
    function (results, cb) {
      var users = [];
      async.each(results, function (result, next) {
        users.push(new User(result));
        next();
      }, function (err) {
        if (err) {
          cb(err);
        } else {
          cb(null, users);
        }
      });
    }
  ], function (err, users) {
    if (err) {
      callback(err);
    } else {
      callback(null, users);
    }
  });
};

User.loadByNames = function (names, callback) {
  alog.info('loadByNames#' + JSON.stringify(names));

  async.waterfall([
    function (cb) {
      db.select()
        .where('name', names)
        .get('user', function (err, results, fields) {
          if (err) {
            cb(err);
          } else {
            cb(null, results);
          }
        });
    },
    function (results, cb) {
      var users = [];
      async.each(results, function (result, next) {
        users.push(new User(result));
        next();
      }, function (err) {
        if (err) {
          cb(err);
        } else {
          cb(null, users);
        }
      });
    }
  ], function (err, users) {
    if (err) {
      callback(err);
    } else {
      callback(null, users);
    }
  });
};

// 유효한 이름과 이메일 주소 그리고 패스워드를 가지고 있는지 검사합니다.
User.validating = function (user, password, options) {
  var res = {
    result: true,
    detail: {
      name: true,
      password: true
    }
  };

  options = options || {};

  if (user.name == null || !Regex.name.test(user.name)) {
    res.result = false;
    res.detail.name = false;
  }

  if ((options.email !== false) && (user.email == null || !Regex.email.test(user.email))) {
    res.result = false;
    res.detail.email = false;
  }

  if (password == null || !Regex.password.test(password)) {
    res.result = false;
    res.detail.password = false;
  }

  return res;
};

User.resignWithoutSigning = function (user, cb) {
  if (User.validating(user)) {
    //@TODO 데이터 베이스에 DELETE 혹은 UPDATE 쿼리 날리기
    cb();
  } else {
    cb('invalid user');
  }
};

User.resign = function (user, password, cb) {
  User.signIn(user, password, function (err, retUser) {
    User.resignWithoutSigning(retUser, function (err) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  });
};

//#endregion - static functions

User.prototype.equal = function (other) {
  return (this.name === other.name);
};

User.prototype.validating = function (password, options) {
  return User.validating(this, password, options);
};

// 패스워드 검사없이 탈퇴합니다.
User.prototype.resignWithoutSigning = function (cb) {
  User.resignWithoutSigning(this, cb);
};

// 탈퇴
User.prototype.resign = function (password, cb) {
  User.resign(this, password, cb);
};

// 로그아웃은 여기서 처리하지 않고 컨트롤러부분에서 처리
/*
User.prototype.signOut = function (cb) {
};
*/

module.exports = User;
