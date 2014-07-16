/*jslint node: true, eqeq: true */
/*global winston*/
'use strict';

/**
 * Module dependencies & Global Variable Setup
 */
var config = global.config = require('./config');
var path = require('path');
var winston = global.winston = require('winston');
winston.setLevels(winston.config.syslog.levels);

var models = global.models = require('./app/models');
var async = global.async = require('async');
var lodash = global._ = require('lodash');
var routes = require('./routes');
var api = routes.api;

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var app = express();


/**
 * Configuration
 */

var env = process.env.NODE_ENV || 'development';

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser('S3CRE7'));
/*
app.use(session({
  secret: 'session password',
}));
*/
app.use(session({ store: new RedisStore({
  host: process.env.SESSION_PORT_6379_TCP_ADDR || '0.0.0.0',
  port: process.env.SESSION_PORT_6379_TCP_PORT || 6379,
  ttl: 60 * 30
}), secret: 'SEKR37'}));

app.set('port', process.env.PORT || 17239);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');


/**
 * Routes
 */

var router = express.Router();

router.route('/auths/join')
  .post(api.auth.join);

router.route('/auths/login')
  .post(api.auth.login);

router.route('/auths/logout')
  .post(api.auth.logout);

router.route('/users')
  .get(api.user.list);

router.route('/user/:id')
  .get(api.user.show)
  .put(api.user.update);

router.route('/problems')
  .get(api.problem.list)
  .post(api.problem.create);

router.route('/problem/:id')
  .get(api.problem.show)
  .put(api.problem.update);

router.route('/submissions')
  .get(api.submission.list)
  .post(api.auth.checkAuth, api.submission.create);

router.route('/submission/:id')
  .get(api.submission.show)
  .put(api.submission.update)
  .delete(api.submission.destroy);

router.route('*')
  .all(function (req, res) {
    res.json(400, 'Bad Request');
  });

app.use('/api', router);

app.route('/')
  .get(routes.index);

app.route('/auths/join')
  .get(routes.auth.join);

app.route('/auths/login')
  .get(routes.auth.login);

app.route('/users/list')
  .get(routes.user.list);

app.route('/users/show')
  .get(routes.user.show);

app.route('/problems/list')
  .get(routes.problem.list);

app.route('/problems/show')
  .get(routes.problem.show);

app.route('/problems/create')
  .get(routes.problem.create);

app.route('/submissions/list')
  .get(routes.submission.list);

app.route('/submissions/show')
  .get(routes.submission.show);

app.route('/submissions/create')
  .get(routes.submission.create);

app.route('*')
  .all(routes.index);

/**
 * Start Server
 */

models
  .sequelize
  .sync({force: false})
  .complete(function (err) {
    if (err) {
      throw err;
    }

    app.listen(app.get('port'));
    winston.info('Express server listening on port ' + app.get('port'));
  });
