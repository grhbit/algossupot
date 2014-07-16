/*jslint node: true, eqeq: true, vars: true */
/*global _, async, config, models*/
'use strict';
var util = require('util');

function SubmissionPool() {
  var submissions = [];

  this.push = function (submission) {
    submissions.push(submission);
  };
}

module.exports.PyProc = require('./pyproc');
module.exports.Pool = new SubmissionPool();
