var _ = require('lodash')
    , printf = require('util').format
    , fs = require('fs')
    , Conf = require('../../conf');

module.exports.logfile = function(logfile) {
    var conf = new Conf('transport:file', ['logfile', 'autoClose'])
    .defaults({autoClose: 60 * 1000});

    if (_.isPlainObject(logfile)) {
        conf = conf.load(logfile);
    }

    if (_.isString(logfile)) {
        conf.set('logfile', logfile);
    }

    var stream = null
        , timeout = null;

    return function() {
        var args = _.toArray(arguments);

        var time = new Date(args.shift())
            , name = args.shift()
            , level = args.shift()
            , message = args.shift();

        var message = printf.apply(null, [
            '[%s] [%s] %s - %s\n',
            time,
            name,
            level.toUpperCase(),
            message
        ]);

        args.unshift(message);
        message = printf.apply(null, args);

        var logfile = conf.get('logfile');

        if (!stream) {
            stream = fs.createWriteStream(logfile, {
                encoding: 'utf8',
                mode: 0600,
                flags: 'a'
            });
            stream.write('Logger:fileTransport stream opened...\n');
        } else if (timeout) {
            cancelTimeout(timeout);
        }

        stream.write(message);

        timeout = setTimeout(function() {
            stream.end('Logger:fileTransport stream closed...\n');
            stream = null;
        }, conf.get('autoClose'));
    };
};
