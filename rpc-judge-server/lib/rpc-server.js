/*jslint node: true*/
'use strict';

module.exports = (function () {
  var defaults = {
    queueName: 'rpc_queue'
  };

  // RPC Server
  return function (open, callback, options) {
    options = options || defaults;
    var queueName = options.queueName || defaults.queueName;

    open.then(function (conn) {
      var ok = conn.createChannel();

      ok = ok.then(function (ch) {
        ch.assertQueue(queueName);

        ch.consume(queueName, function (msg) {
          callback(msg, function (err, res) {
            ch.publish('', msg.properties.replyTo, res, {
              correlationId: msg.properties.correlationId
            });
            ch.ack(msg);
          });
        });
      });
    }, function (err) {
      console.error('Connect failed: %s', err);
    });
  };
}());
