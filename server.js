/*jslint node: true, eqeq: true */
/*global winston*/
'use strict';

/**
 * Module dependencies
 */
var config = global.config = require('./config');

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var app = express();

var async = require('async');
var routes = require('./config/routes');
var path = require('path');
var models = require('./app/models');
var winston = require('winston');

/**
 * Global Variable Setup
 */

global.async = async;
global.config = config;
global.models = models;
global.winston = winston;
winston.setLevels(winston.config.syslog.levels);


/**
 * Configuration
 */

var env = process.env.NODE_ENV || 'development';

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser('S3CRE7'));
app.use(session({ store: new RedisStore({
  host: '127.0.0.1',
  port: 6379,
}), secret: 'SEKR37', key: 'sid', cookie: { secure: true } }));

app.set('port', process.env.PORT || 17239);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');


/**
 * Routes
 */

var router = express.Router();
app.use('/api', router);

routes.use(app);

/**
 * Start Server
 */

models
  .sequelize
  .sync()
  .complete(function (err) {
    if (err) {
      throw err;
    }

    app.listen(app.get('port'));
    winston.info('Express server listening on port ' + app.get('port'));
  });
