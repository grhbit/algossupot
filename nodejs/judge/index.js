/*jslint node: true */
/*global _, async, config, models*/
'use strict';

var open = require('amqplib').connect('amqp://172.17.42.1'),
  fs = require('fs'),
  uuid = require('uuid');

module.exports = (function () {
  var defaults = {
    queueName: 'rpc_queue'
  };

  return function (options, callback) {
    options = options || {};

    var submission = options.submission,
      problem = options.problem,
      queueName = options.queueName || defaults.queueName;

    open.then(function (conn) {
      var ok = conn.createChannel();
      console.log('open - ok!');

      ok.then(function (ch) {
        console.log('createChannel - ok!');
        var replyTo = uuid.v4(),
          correlationId = uuid.v4();

        ch.assertQueue(replyTo, { exclusive: true });

        ch.publish('', queueName, new Buffer(JSON.stringify({
          submission: submission,
          problem: problem
        })), {
          correlationId: correlationId,
          replyTo: replyTo
        });

        console.log('publish - ok!');

        ch.consume(replyTo, function (msg) {
          if (msg.properties.correlationId === correlationId) {
            console.log(msg.content.toString('utf8'));
            callback(null, JSON.parse(msg.content.toString('utf8')));
          }
        });
      });
    });
  };

}())();
