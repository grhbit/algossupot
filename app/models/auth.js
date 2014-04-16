/*jslint node: true, eqeq: true */
/*global sqlClient, sqlQuery, alog, db*/
'use strict';

var table_name = 'auth';
var crypto = require('crypto');
var encryption_algorithm = 'sha1';
var encryption_key = 'this is algossupot encryption key';


var Query = {
  signUp: 'INSERT INTO `algossupot`.`auth` (userid, password);'
  // signUp: 'INSERT INTO `algossupot`.`auth` (userid, email, password) SELECT :userid, :email, :password FROM DUAL WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`user` WHERE name = :name ) ;',

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


// 유저를 데이터베이스에 추가합니다.
User.signUp = function (id, pw, callback) {
  if (Regex.name.test(id) && Regex.password.test(pw)) {
    db.where('userid', id)
      .count(table_name,
        function (err, result, fields) {
          if (result == 0) {

            var hmacer = crypto.createHmac(encryption_algorithm, encryption_key).update(pw),
              data = {
                userid: id,
                password: hmacer.digest('hex')
              };

            db.insert(table_name,
              data,
              function (err, info) {
                if (err) {
                  callback(err);
                } else {
                  alog.info(JSON.stringify(info));
                  callback(null, info);
                }
              });
          } else {
            callback('already registed user');
          }
        });
  } else {
    callback('regex fail');
  }
};


// // 로그인을 처리하는 함수입니다.
// User.signIn = function (user, password, cb) {
//   var validation = User.validating(user, password, { email: false });

//   if (validation.result) {
//     alog.info('User.signIn');
//     sqlClient.query(sqlQuery.User.loadByName, user)
//       .on('result', function (res) {
//         res.on('row', function (row) {
//           alog.info(row);

//           //@TODO: 패스워드 암호화 후 비교
//           if (password === row.password) {
//             alog.info('User.signIn#{OK}' + user.name);
//             cb(null, new User(row));
//           } else {
//             alog.info('User.signIn#{NO}' + user.name);
//             cb('password incorrect');
//           }
//         }).on('error', function (err) {
//           alog.error(err);
//           cb(err);
//         }).on('end', function (info) {
//           alog.info(info);
//         });
//       });
//   } else {
//     alog.info('User.signIn#{NO}' + user.name);
//     cb('validation failed');
//   }
// };


//#endregion - static functions


module.exports = User;
