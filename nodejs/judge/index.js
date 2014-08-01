/*jslint node: true */
/*global _, async, config, models*/
'use strict';

var open = require('amqplib').connect('amqp://localhost'),
  fs = require('fs'),
  uuid = require('uuid'),
  optionsValidate = function (options) {
    options = options || {};
    var source = options.source || {},
      problem = options.problem || {},
      metadata = problem.metadata,
      limit = problem.limit,
      mark = problem.mark,
      bSource = source && source.path && source.language,
      bMetadata = metadata && metadata.slug && metadata.name,
      bLimit = limit && limit.time && limit.memory && limit.disk,
      bMarkIn = mark && mark.in && mark.in.method && mark.in.path,
      bMarkOut = mark && mark.out && mark.out.method && mark.out.path;

    return !(bSource && bMetadata && bLimit && bMarkIn && bMarkOut);
  };

module.exports = (function () {
  var defaults = {
    queueName: 'rpc_queue'
  };

  return function (options, callback) {
    options = options || {};

    if (optionsValidate(options)) {
      return callback(new Error('Invalid source or problem'));
    }

    var source = options.source,
      problem = options.problem,
      queueName = options.queueName || defaults.queueName;

    open.then(function (conn) {
      var ok = conn.createChannel();

      ok.then(function (ch) {
        var replyTo = uuid.v4(),
          correlationId = uuid.v4();

        ch.assertQueue(replyTo, { exclusive: true });

        ch.publish('', queueName, new Buffer(JSON.stringify({
          source: source,
          problem: problem
        })), {
          correlationId: correlationId,
          replyTo: replyTo
        });

        ch.consume(replyTo, function (msg) {
          if (msg.properties.correlationId === correlationId) {
            console.log(msg.content.toString('utf8'));
            callback(null, JSON.parse(msg.content.toString('utf8')));
          }
        });
      });
    });
  };

}());
