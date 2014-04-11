/*jslint node: true, eqeq: true */
/*global sqlClient, alog*/
'use strict';

var Query = {
  findById: 'SELECT * FROM algossupot.user WHERE id=:id LIMIT 1',
  findByName: 'SELECT * FROM algossupot.user WHERE name=:name LIMIT 1',
  signUp: 'INSERT INTO `algossupot`.`user` (name, email, password) SELECT :name, :email, :password FROM DUAL WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`user` WHERE name = :name ) ;',
  resign: 'DELETE FROM `algossupot`.`user` WHERE id = :id;'
}, Regex = {
  name: /^[a-z0-9_\-]{3,32}$/,
  email: /^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/,
  password: /^[a-z0-9_\-]{6,18}$/
};

function User() {
  this.id = null;
  this.name = null;
  this.email = null;
  this.password = null;
}

User.prototype.loadById = function (id, cb) {
  var self = this;
  sqlClient.query(Query.findById, { id: id })
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        self.id = row.id;
        self.name = row.name;
        self.email = row.email;
        self.password = row.password;
      }).on('error', function (err) {
        alog.error(err);

      }).on('end', function (info) {
        alog.info(info);
      });
    }).on('end', function () {
      cb();
    });
};

User.prototype.loadByName = function (name, cb) {
  var self = this;
  sqlClient.query(Query.findByName, { name: name })
    .on('result', function (res) {
      res.on('row', function (row) {
        alog.info(row);

        self.id = row.id;
        self.name = row.name;
        self.email = row.email;
        self.password = row.password;

      }).on('error', function (err) {
        alog.error(err);

      }).on('end', function (info) {
        alog.info(info);
      });
    }).on('end', function () {
      cb();
    });
};

User.prototype.equal = function (other) {
  if (this.name !== other.name ||
      this.email !== other.email ||
      this.password !== other.password) {
    console.log(JSON.stringify(this));
    console.log(JSON.stringify(other));
    return false;
  }

  return true;
};

User.prototype.validating = function () {
  var res = {
    result: true,
    detail: {
      name: true,
      email: true,
      password: true
    }
  };

  if (this.name == null || !Regex.name.test(this.name)) {
    res.result = false;
    res.detail.name = false;
  }

  if (this.email == null || !Regex.email.test(this.email)) {
    res.result = false;
    res.detail.email = false;
  }

  if (this.password == null || !Regex.password.test(this.password)) {
    res.result = false;
    res.detail.password = false;
  }

  return res;
};

// 회원가입
User.prototype.signUp = function (cb) {
  var self = this,
    validation = self.validating();

  alog.info(validation);
  if (validation.result) {
    alog.info('User.signup');
    sqlClient.query(Query.signUp, self)
      .on('result', function (res) {
        res.on('row', function (row) {
          alog.info(row);
        }).on('error', function (err) {
          alog.error(err);
          cb(err);
        }).on('end', function (info) {
          alog.info(info);

          if (info.affectedRows === 0) {
            cb('User signup failed');
          } else {
            self.id = info.insertId;
            cb();
          }
        });
      });
  } else {
    cb('invalid User');
  }
};

// 로그인
User.prototype.signIn = function (cb) {
  var self = this,
    validation = self.validating();

  if (validation.result) {
    alog.info('User.signIn');
    sqlClient.query(Query.findByName, self)
      .on('result', function (res) {
        res.on('row', function (row) {
          alog.info(row);

          //@TODO: 패스워드 암호화 후 비교
          if (self.equal(row)) {
            alog.info('User.signIn#' + self.name + ' - signin success');

            //@TODO: 세션에 추가?
            cb(null, true);
          } else {
            alog.info('User.signIn#' + self.name + ' - signin failed');
            cb(null, false);
          }
        }).on('error', function (err) {
          alog.error(err);
          cb(err);
        }).on('end', function (info) {
          alog.info(info);

          if (info.numRows !== 0) {
            self.id = info.insertId;
          }

        });
      });
  } else {
    alog.info('User.signIn - validation failed');
    cb(null, false);
  }
};

// 로그아웃
User.prototype.signOut = function (cb) {
};

// 탈퇴
User.prototype.resign = function (cb) {
};

module.exports = User;
