/*jslint node: true*/
'use strict';

var open = require('amqplib').connect('amqp://localhost'),
  rpcServer = require('./lib/rpc-server.js'),
  sandbox = require('./lib/sandbox.js'),
  util = require('util');

rpcServer(open, function (msg, cb) {
  try {
    var obj = JSON.parse(msg.content.toString('utf8')),
      source = obj.source,
      problem = obj.problem;

    if (!(source && source.path && source.language) ||
        !(problem && problem.metadata && problem.limit &&
          problem.mark)) {
      console.error('Invalid message');
      throw new Error('Invalid message');
    }

    console.log(source);
    console.log(problem);

    sandbox(source, problem, function (err, result) {
      if (result && ([
          'CompileError',
          'TimeLimitExceed',
          'MemoryLimitExceed',
          'OutputLimitExceed',
          'RuntimeError',
          'Accepted',
          'WrongAnswer'
        ].indexOf(result.state) !== -1)) {
        return cb(null, new Buffer(JSON.stringify(result)));
      }

      cb(null, new Buffer(JSON.stringify({ state: 'InternalError' })));
    });
  } catch (err) {
    cb(null, new Buffer(JSON.stringify({ state: 'InternalError' })));
  }
}, {
  queueName: "rpc_queue"
});
