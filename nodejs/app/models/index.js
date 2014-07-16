/*jslint node: true, eqeq: true */
'use strict';
var fs = require('fs'),
  path = require('path'),
  Sequelize = require('sequelize'),
  lodash = require('lodash'),
  sequelize = new Sequelize('algossupot', 'admin', 'password', {
    dialect: 'mariadb',
    host: process.env.DB_PORT_3306_TCP_ADDR,
    port: process.env.DB_PORT_3306_TCP_PORT,
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    }
  }),
  mariadb = {};

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return ((file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) == '.js'));
  }).forEach(function (file) {
    var model = sequelize.import(path.join(__dirname, file));
    mariadb[model.name] = model;
  });

Object.keys(mariadb).forEach(function (modelName) {
  if (mariadb[modelName].options.hasOwnProperty('associate')) {
    mariadb[modelName].options.associate(mariadb);
  }
});

module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, mariadb);
