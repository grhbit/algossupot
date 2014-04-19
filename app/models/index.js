/*jslint node: true, eqeq: true */
'use strict';
var fs = require('fs'),
  path = require('path'),
  Sequelize = require('sequelize'),
  lodash = require('lodash'),
  sequelize = new Sequelize('algossupot', 'algossupotadmin', 'ncloudme', {
    dialect: 'mariadb',
    host: '127.0.0.1',
    port: 3306
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
