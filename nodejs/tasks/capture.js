'use strict';

module.exports = function (grunt) {
    var os = require('os');
    var format = require('util').format;
    var exec = require('child_process').exec;

    if (os.type() !== 'Linux') {
        grunt.registerTask('capture', function () {
            grunt.log.ok('Skipped capturing system call.');
        });

        return grunt.registerTask('default', 'capture');
    }

    grunt.registerTask('capture', function (lang) {
        var options = this.options();

        var captureScript = options.script;
        var input = options.input;
        var exePath = options[lang].dst;

        var done = this.async();
        var cmd = format('python %s %s < %s > /dev/null', captureScript, exePath, input);
        exec(cmd, function (err, stdout, stderr) {
            grunt.file.delete(exePath);
            if (err) {
                grunt.fatal(err);
                return done(false);
            }

            grunt.config.set('capture.result.' + lang, JSON.parse(stderr));
            done();
        });
    });
};
