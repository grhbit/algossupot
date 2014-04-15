/*jslint node: true, eqeq: true */
/*global sqlClient, sqlQuery, alog*/
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
  sqlClient.query(Query.findById, {id: id})
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        var user = new User(row);
        cb(null, user);
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        if (info.numRows === 0) {
          cb(null, {});
        }
      });
    });
};

User.loadByName = function (name, cb) {
  alog.info('User.loadById#' + name);
  sqlClient.query(Query.findByName, {name: name})
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        var user = new User();
        user.id = row.id;
        user.name = row.name;
        user.email = row.email;
        user.password = row.password;
        cb(null, user);
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);
      });
    });
};

User.loadByIds = function (ids, cb) {
  var users = [];

  alog.info('loadByIds#' + JSON.stringify(ids));
  sqlClient.query(sqlQuery.User.Static.loadByIds, {ids: ids})
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        var user = new User(row);

        if (user.validation().result) {
          users.push(user);
        }
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        cb(null, users);
      });
    });
};

User.loadByNames = function (names, cb) {
  var users = [];

  alog.info('loadByNames#' + JSON.stringify(names));
  sqlClient.query(sqlQuery.User.Static.loadByNames, {names: names})
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        var user = new User(row);
        if (user.validation().result) {
          users.push(user);
        }
      }).on('error', function (err) {
        alog.error(err);
        cb(err);
      }).on('end', function (info) {
        alog.info(info);

        cb(null, users);
      });
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

  if (this.name == null || !Regex.name.test(this.name)) {
    res.result = false;
    res.detail.name = false;
  }

  if ((options.email !== false) && (this.email == null || !Regex.email.test(this.email))) {
    res.result = false;
    res.detail.email = false;
  }

  if (password == null || !Regex.password.test(password)) {
    res.result = false;
    res.detail.password = false;
  }

  return res;
};

// 유저를 데이터베이스에 추가합니다.
User.signUp = function (user, password, cb) {
  var validation = User.validating(user),
    tmpUser;

  alog.info(validation);
  if (validation.result) {
    alog.info('User.signUp');

    tmpUser = new User(user);
    tmpUser.password = password;
    sqlClient.query(Query.signUp, tmpUser)
      .on('result', function (res) {
        delete tmpUser.password;

        res.on('row', function (row) {
          alog.info(row);
        }).on('error', function (err) {
          alog.error(err);
          cb(err);
        }).on('end', function (info) {
          alog.info(info);

          tmpUser.id = info.insertId;
          cb(null, tmpUser);
        });
      });
  } else {
    cb('invalid User');
  }
};

// 로그인을 처리하는 함수입니다.
User.signIn = function (user, password, cb) {
  var validation = User.validating(user, password, { email: false });

  if (validation.result) {
    alog.info('User.signIn');
    sqlClient.query(sqlQuery.User.loadByName, user)
      .on('result', function (res) {
        res.on('row', function (row) {
          alog.info(row);

          //@TODO: 패스워드 암호화 후 비교
          if (password === row.password) {
            alog.info('User.signIn#{OK}' + user.name);
            cb(null, new User(row));
          } else {
            alog.info('User.signIn#{NO}' + user.name);
            cb('password incorrect');
          }
        }).on('error', function (err) {
          alog.error(err);
          cb(err);
        }).on('end', function (info) {
          alog.info(info);
        });
      });
  } else {
    alog.info('User.signIn#{NO}' + user.name);
    cb('validation failed');
  }
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

// 회원가입
User.prototype.signUp = function (password, cb) {
  User.signUp(this, password, cb);
};

// 로그인
User.prototype.signIn = function (password, cb) {
  User.signIn(this, password, cb);
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
