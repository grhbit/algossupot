/*jslint node: true, eqeq: true, vars: true */
/*global _, async, config, models*/
'use strict';

var spawn = require('child_process').spawn;

function PySubprocess(obj, callback, end) {
  var opt = {
    'problem-dir': obj['problem-dir'] || null,
    'working-dir': obj['working-dir'] || null,
    'source-path': obj['source-path'] || null,
    'language': obj.language || null
  },
    args = [config.judge.script],
    proc, text = '', newlineIndex, stateStr, reply;

  _.forIn(opt, function (val, key) {
    args.push('--' + key + '=' + val);
  });

  proc = spawn('python', args);
  reply = function (err) {
    if (err) {
      return proc.stdin.write('NO\n');
    }
    proc.stdin.write('OK\n');
  };

  proc.stdin.setEncoding = 'utf-8';
  proc.on('stderr', function (data) {
    text += data;

    while (true) {
      newlineIndex = text.indexOf('\n');

      if (newlineIndex === -1) {
        break;
      }

      stateStr = text.slice(0, newlineIndex);
      callback(stateStr, reply);
      text = text.slice(newlineIndex + 1);
    }
  });
  proc.on('error', function (err) { return undefined; });
  proc.stdin.on('error', function (err) { return undefined; });
  proc.on('exit', end);
}

module.exports = PySubprocess;
