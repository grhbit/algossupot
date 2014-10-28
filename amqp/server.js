/*jslint node: true*/
'use strict';

var open = require('amqplib').connect('amqp://localhost'),
  rpcServer = require('./lib/rpc-server.js'),
  sandbox = require('./lib/sandbox.js')({
    sandboxDataDir: "../sandbox/data",
    storageDir: "../nodejs/storage",
    languageExt: {
      'cpp': 'cpp',
      'cplusplus': 'cpp',
      'python': 'py',
      'ruby': 'rb'
    }
  }),
  fs = require('fs-extra'),
  path = require('path'),
  util = require('util');

rpcServer(open, function (msg, cb) {
  try {
    var obj = JSON.parse(msg.content.toString('utf8')),
      submission = obj.submission,
      problem = obj.problem,
      indexPath = path.join("../nodejs/storage/problem", problem.slug, "index.json");

    console.log(indexPath);
    problem = fs.readJsonSync(indexPath, {encoding: 'utf8'});

    console.log('submission => ' + util.inspect(submission));
    console.log('problem => ' + util.inspect(problem));

    sandbox(submission, problem, function (err, result) {
      console.log(err);
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
    console.log(err);
    cb(null, new Buffer(JSON.stringify({ state: 'InternalError' })));
  }
}, {
  queueName: "rpc_queue"
});
