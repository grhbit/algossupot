/*jslint node: true, eqeq: true */
/*global async, config*/
'use strict';
var util = require('util');
var events = require('events').EventEmitter;
var spawn = require('child_process').spawn;

function JudgeProcess(submission) {
  var pythonJudge,
    text = '',
    newlineIndex,
    self = this,
    stateStr = '';

  events.call(this);

  async.series({
    sourceCode: function (cb) {
      submission.getSourceCodePath(function (err, path) {
        return cb(err, path);
      });
    }
  }, function (err, results) {
    pythonJudge = spawn("python", [config.judge.script, results.sourceCode]);

    pythonJudge.stderr.on('data', function (data) {
      text += data;

      while (true) {
        newlineIndex = text.indexOf('\n');

        if (newlineIndex === -1) {
          break;
        }

        stateStr = text.slice(0, newlineIndex);
        self.emit('state', stateStr);
        text = text.slice(newlineIndex + 1);
      }

    });

    pythonJudge.on('exit', function (code) {
      self.emit('state', text);
      self.emit('exit', code);
    });

  });
}

util.inherits(JudgeProcess, events);

module.exports = JudgeProcess;
