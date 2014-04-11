'use strict';
var express = require('express');
var routes = require('./config/routes');
var user = require('./config/routes/user');
var sessions = require('./config/routes/sessions');
var http = require('http');
var path = require('path');
var MariaSQL = require('mariasql');
var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'error',
      colorize: true,
      timestamp: true
    }),
    new (winston.transports.Webhook)({
      host: 'localhost',
      port: 8081,
      path: '/collectdata'
    })
  ]
});

global.logger = logger;

var app = express();
var client = new MariaSQL();
client.connect({
  host: '127.0.0.1',
  port: 17240,
  user: 'ssu_user',
  password: 'ncloudme'
});

client.on('connect', function () {
  console.log('db connected');
  global.sqlClient = client;
}).on('error', function () {
  console.log('db connection error');
  global.sqlClient = null;
}).on('close', function () {
  console.log('db connection closed');
  global.sqlClient = null;
});

// all environments
app.set('port', process.env.PORT || 17239);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.param('uid', function (req, res, next, id) {
  user.get(id, function (err, reply) {
    if (err) {
      next(err);
    } else if (reply) {
      req.user = reply;
      next();
    } else {
      next('');
    }
  });
});

app.all('/users/*', function (req, res) {

});

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/test/:name/:email/:password', function (req, res) {
  console.info(req.params);
  user.register({
    name: req.params.name,
    email: req.params.email,
    password: req.params.password
  }, function (err) {
    if (err) {
      res.end(err);
    } else {
      res.json('');
    }
  });
});

//app.param('uid', Number);
app.get('/users/:uid', function (req, res) {
  res.json({id: req.params.uid});
  logger.log('user');
});

app.get('/sessions', sessions.index);

http.createServer(app).listen(app.get('port'), function () {
  logger.log('info', 'Express server listening on port ' + app.get('port'));
});
