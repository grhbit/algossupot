/*jslint node: true*/
'use strict';

var open = require('amqplib').connect('amqp://localhost'),
  rpcServer = require('./lib/rpc-server.js'),
  sandbox = require('./lib/sandbox.js'),
  util = require('util');

rpcServer(open, function (msg, cb) {
  try {
    var obj = JSON.parse(msg.content),
      source = obj.source,
      problem = obj.problem;

    console.log(util.inspect(source));
    console.log(util.inspect(problem));

    sandbox(source, problem, function (err, result) {
      console.error(err);
      console.log(result);
    });
  } catch (err) {
    cb(err);
  }

  cb(null, new Buffer('100'), 'utf8');
}, {
  queueName: "rpc_queue"
});
