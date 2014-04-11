/*global sqlClient*/
'use strict';

exports.list = function (req, res) {
  res.render('index', {title: "algospot"});
};

// 이미 등록된 이름(아이디)인지 검사한다.
// callback(err, reply)
// err: error가 발생하면 != null, 없으면 null
// reply: 이미 존재하는 이름일 경우 true, 아닐 경우 false, 에러가 발생하면 undefined
exports.isExist = function (user, cb) {
  if (sqlClient === null) {
    cb('');
  } else {
    sqlClient.query('SELECT * FROM algossupot.user WHERE name=:name LIMIT 1', { name: user.name })
      .on('result', function (res) {
        cb(null, (res || []).length !== 0);
      })
      .on('error', function (err) {
        cb(err);
      });
  }
};

exports.get = function (id, cb) {
  if (sqlClient === null) {
    cb('');
  } else {
  }
};

// 새로 회원 등록을 한다.
// callback(err, reply)
// err: error가 발생하면 != null, 없으면 null
// reply:
exports.register = function (user, cb) {
  if (sqlClient === null) {
    cb('');
  } else {
    var escapedName = sqlClient.escape(user.name || ''),
      escapedEmail = sqlClient.escape(user.email || ''),
      escapedPassword = sqlClient.escape(user.password || '');

    if (/^[a-z0-9_\-]{3,32}$/.test(escapedName) === false) {
      cb('Invalid Name');
      return;
    }

    if (/^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/.test(escapedEmail) === false) {
      cb('Invalid Email');
      return;
    }

    if (/^[a-z0-9_\-]{6,18}$/.test(escapedPassword) === false) {
      cb('Invalid Password');
      return;
    }

    sqlClient.query("INSERT INTO `algossupot`.`user` (name, email, password) SELECT :name, :email, :password FROM dual WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`user` WHERE name = :name ) ;",
      { name: escapedName, email: escapedEmail, password: escapedPassword })
      .on('result', function (res) {
        res.on('row', function (row) {
          console.log(row);
        }).on('error', function (err) {
          console.error(err);
          cb('signup failed');
        }).on('end', function (info) {
          console.info(info);
          if ((info.affectedRows || 0) !== 0) {
          } else {
          }
        });
      });
  }
};
