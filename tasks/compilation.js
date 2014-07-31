'use strict';

module.exports = function (grunt) {
    var os = require('os');
    var format = require('util').format;
    var path = require('path');
    var exec = require('child_process').exec;

    if (os.type() !== 'Linux') {
        grunt.registerTask('compilation', function () {
            grunt.log.ok('Skipped compilation.');
        });

        return grunt.registerTask('default', 'compilation');
    }

    var makeRunnable = function (scriptPath, cb) {
        var cmd = format('chmod +x %s', scriptPath);
        exec(cmd, function (err, stderr) {
            if (err) { grunt.fatal(err); }
            cb(err);
        });
    };
    var compilation = {
        cpp: function (options, done) {
            var compile = function (cb) {
                var srcPath = options.cpp.src;
                var dstPath = options.cpp.dst;
                var cmd = format('g++ -static -o %s %s', dstPath, srcPath);
                exec(cmd, function (err) { cb(err); });
            };
            compile(function (err) {
                if (err) {
                    grunt.fatal(err);
                    return done(false);
                }
                done();
            });
        },
        python: function (options, done) {
            var srcPath = options.python.src;
            var dstPath = options.python.dst;
            grunt.file.copy(srcPath, dstPath);
            makeRunnable(dstPath, function (err) {
                if (err) {
                    grunt.fatal(err);
                    return done(false);
                }
                done();
            });
        },
        ruby: function (options, done) {
            var srcPath = options.ruby.src;
            var dstPath = options.ruby.dst;
            grunt.file.copy(srcPath, dstPath);
            makeRunnable(dstPath, function (err) {
                if (err) {
                    grunt.fatal(err);
                    return done(false);
                }
                done();
            });
        }
    };

    grunt.initConfig({
        compilation: {
            options: {
                cpp: { src: '../fixtures/fibo.cpp', dst: 'tmp.out' },
                python: { src: '../fixtures/fibo.py', dst: 'tmp.out' },
                ruby: { src: '../fixtures/fibo.rb', dst: 'tmp.out' }
            }
        }
    });

    grunt.registerTask('default', ['compilation:cpp']);

    grunt.registerTask('compilation', function (lang) {
        if (!compilation[lang]) {
            return grunt.fatal('unknown language: ' + lang);
        }

        var done = this.async();
        var options = this.options();
        compilation[lang](options, done);
    });
};
