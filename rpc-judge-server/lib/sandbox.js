/*jslint node: true, eqeq: true */
'use strict';

var fs = require('fs-extra');
var sprintf = require('sprintf-js').sprintf;
var async = require('async');
var exec = require('child_process').exec;
var path = require('path');
var join = path.join;
var basename = path.basename;
var tmp = require('tmp');

var command = [
  'docker', 'run',
  '-v', '%(datadir)s:/data',
  '--net=none',
  '--rm',
  'sandbox',
  '%(command)s',
  '%(argument)s'
].join(' ');

module.exports = (function (config) {

  config = config || {
    "queueName": "rpc_queue",
    "sandboxDataDir": "./data",
    "storageDir": "../nodejs/storage"
  };


  return function (source, problem, callback) {
    var mkstemps = function (cb) {
      tmp.dir({
        template: join(config.sandboxDataDir, 'sandbox-XXXXXXX'),
        mode: 488
      }, function (err, path) {
        cb(err, path);
      });
    }, compile = function (datadir, options, cb) {
      var cmd = sprintf(command, {
        datadir: datadir,
        command: '/opt/compile.py',
        argument: sprintf([
          '--lang=%(language)s',
          '--source=%(source)s',
          '--output=%(output)s'
        ].join(' '), options)
      }), child;

      console.log('cmd', cmd);

      child = exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
          return cb(error);
        }

        if (child.exitCode !== 0) {
          return cb(new Error('CompileError'), stderr);
        }

        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        cb(null, JSON.parse(stdout));
      });
    }, monitor = function (datadir, options, entrypoint, cb) {
      if (arguments.length == 3) {
        cb = entrypoint;
        entrypoint = options;
      }

      options = options || {};

      var cmd = sprintf(command, {
        datadir: datadir,
        command: '/opt/monitor.py',
        argument: sprintf([
          '-t %(timeLimit)d',
          '-m %(memoryLimit)d',
          '-d %(diskLimit)d',
          '--in=%(inputPath)s',
          '--out=%(outputPath)s',
          '--err=%(errorPath)s',
          '%(entrypoint)s',
          '%(argument)s'
        ].join(' '), {
          timeLimit: options.timeLimit || 1024 * 10,
          memoryLimit: options.memoryLimit || 1024 * 1024 * 10,
          diskLimit: options.diskLimit || 1024 * 1024 * 10,
          inputPath: options.inputPath || '/data/in.txt',
          outputPath: options.outputPath || '/data/out.txt',
          errorPath: options.errorPath || '/data/err.txt',
          entrypoint: entrypoint,
          argument: options.argument || ''
        })
      });

      console.log(cmd);

      exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
          return cb(error);
        }

        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        var result = JSON.parse(stdout);
        cb(result.state !== 'Passed' ? new Error(result.state) : null, result);
      });
    };

    mkstemps(function (err, datadir) {
      datadir = join(__dirname, datadir);

      var inputGenerate = function (cb) {
        var input = problem.mark.in,
          inDstPath = join(datadir, 'in.txt'),
          method = {
            fixed: function (cb) {
              var inSrcPath = join(problem.path, input.path);
              fs.copy(inSrcPath, inDstPath, cb);
            },
            script: function (cb) {
              mkstemps(function (err, workdir) {
                if (err !== null) {
                  return cb(err);
                }

                var genScriptSrcPath = join(problem.path, input.path),
                  genScriptDstPath = join(workdir, basename(input.path)),
                  sourcePath = join('/data/', basename(input.path)),
                  outputPath = '/data/generate.o';

                async.waterfall([
                  async.apply(fs.copy, genScriptSrcPath, genScriptDstPath),
                  async.apply(compile, workdir, {
                    language: input.language,
                    source: sourcePath,
                    output: outputPath
                  }),
                  async.apply(monitor, workdir, {
                    inputPath: '/dev/null',
                    outputPath: '/data/in.txt'
                  }),
                  async.apply(fs.copy, join(__dirname, workdir, 'in.txt'), inDstPath),
                  async.apply(fs.remove, workdir),
                ], cb);
              });
            }
          };

        if (method.hasOwnProperty(input.method)) {
          method[input.method](function (err) {
            if (err) {
              return cb(new Error('InternalError'), err);
            }

            cb(null);
          });
        } else {
          cb(new Error('Unknown input file generation method.'));
        }
      }, running = function (cb) {
        var limit = problem.limit;

        async.waterfall([
          async.apply(fs.copy, source.path, join(datadir, basename(source.path))),
          async.apply(compile, datadir, {
            language: source.language,
            source: join('/data', basename(source.path)),
            output: '/data/O.o'
          }),
          async.apply(monitor, datadir, {
            timeLimit: limit.time,
            memoryLimit: limit.memory,
            diskLimit: limit.disk
          })
        ], function (err) {
          cb(err);
        });
      }, marking = function (cb) {
        var output = problem.mark.out,
          diff = function (answerOutputPath, userOutputPath, diffMethod, cb) {
            var method = {
            };
            cb(null, true);
          },
          method = {
            fixed: function (cb) {
              var outputPath = join(datadir, 'out.txt'),
                answerPath = join(problem.path, output.path),
                diffOption = output.diffOption;

              diff(answerPath, outputPath, diffOption, cb);
            },
            'answer-script': function (cb) {
              mkstemps(function (err, answerScriptWorkDir) {
                if (err !== null) {
                  return cb(err);
                }

                answerScriptWorkDir = join(__dirname, answerScriptWorkDir);

                var limit = problem.limit,
                  outputPath = join(datadir, 'out.txt'),
                  answerPath = join(answerScriptWorkDir, basename(output.path)),
                  diffOption = output.diffOption;

                async.waterfall([
                  async.apply(fs.copy, join(problem.path, output.path), answerPath),
                  async.apply(compile, answerScriptWorkDir, {
                    language: output.language,
                    source: join('/data', basename(output.path)),
                    output: '/data/O.o'
                  }),
                  async.apply(monitor, answerScriptWorkDir, {
                    timeLimit: limit.time,
                    memoryLimit: limit.memory,
                    diskLimit: limit.disk
                  }),
                  async.apply(diff, answerPath, outputPath, diffOption)
                ], function (err, result) {
                  fs.remove(answerScriptWorkDir);

                  if (err !== null) {
                    return cb(err);
                  }

                  cb(null, result);
                });
              });
            },
            'marking-script': function (cb) {
              mkstemps(function (err, markingScriptWorkDir) {
                if (err !== null) {
                  return cb(err);
                }

                markingScriptWorkDir = join(__dirname, markingScriptWorkDir);

                var limit = problem.limit,
                  inputPath = join(datadir, 'in.txt'),
                  outputPath = join(datadir, 'out.txt'),
                  markingScriptPath = join(markingScriptWorkDir, basename(output.path));

                async.waterfall([
                  async.apply(fs.move, inputPath, join(markingScriptWorkDir, 'in.txt')),
                  async.apply(fs.move, outputPath, join(markingScriptWorkDir, 'out.txt')),
                  async.apply(fs.copy, join(problem.path, output.path), markingScriptPath),
                  async.apply(compile, markingScriptWorkDir, {
                    language: output.language,
                    source: join('/data', basename(output.path)),
                    output: '/data/O.o'
                  }),
                  async.apply(monitor, markingScriptWorkDir, {
                    timeLimit: limit.time,
                    memoryLimit: limit.memory,
                    diskLimit: limit.disk,
                    inputPath: '/dev/null',
                    outputPath: '/data/result.txt',
                    argument: [
                      '/data/in.txt',
                      '/data/out.txt'
                    ].join(' ')
                  }),
                ], function (err) {
                  if (err !== null) {
                    // clean directory
                    fs.remove(markingScriptWorkDir);
                    return cb(err);
                  }

                  try {
                    var resultStream =
                      fs.createReadStream(join(markingScriptWorkDir, 'result.txt'), {
                        start: 0,
                        end: 1,
                      }), result = '';

                    resultStream.on('data', function (chunk) {
                      result += chunk;
                    });

                    resultStream.on('end', function () {
                      cb(null, (result === 'ok') ? 'Accepted' : 'WrongAnswer');
                    });
                  } catch (er) {
                    cb(er);
                  }
                });
              });
            }
          };

        if (method.hasOwnProperty(output.method)) {
          method[output.method](cb);
        } else {
          cb(new Error('Unknown marking method.'));
        }
      };

      async.waterfall([
        inputGenerate,
        running,
        marking,
      ], function (err, result) {
        if (err) {
          return callback(err);
        }

        callback(null, result);
      });
    });

  };
}());
