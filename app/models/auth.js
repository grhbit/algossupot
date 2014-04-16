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


// 로그인을 처리하는 함수입니다.
User.signIn = function (id, pw, callback) {

  var hmacer = crypto.createHmac(encryption_algorithm, encryption_key).update(pw),
    hashed_pw = hmacer.digest('hex');

  db.where({
    userid: id,
    password: hashed_pw
  })
    .count(table_name,
      function (err, result, fields) {
        if (err) {
          alog.error(err);
          callback(err);
        } else {
          if (result == 0) {
            // not found same data
            alog.error('User.signIn#{NO}' + id);
            alog.error(JSON.stringify({
              userid: id,
              password: hashed_pw
            }));
          } else if (result == 1) {
            // found!
            alog.info('User.signIn#{OK}' + id);
            callback(null, new User({ id: id, name: 'tester', email: 'tester@ssu.ac.kr' }));
          }
        }
      });
};


//#endregion - static functions


module.exports = User;
