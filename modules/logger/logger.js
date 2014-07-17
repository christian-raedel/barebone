var _ = require('lodash')
    , printf = require('util').format
    , fs = require('fs')
    , colors = require('colors')
    , Conf = require('../conf');

module.exports = Logger;

function Logger(config) {
    var conf = this.config(config);

    this.conf = conf;

    return this;
};

Logger.prototype.config = function(config) {
    var def = {
        theme: {
            info: 'green',
            warn: 'yellow',
            debug: 'grey',
            error: 'redBG'
        }
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('Logger', [
        'theme'
    ])
    .defaults(def);

    conf.on('onValueChanged:theme', function(args) {
        colors.setTheme(args.newValue);
    });

    this.conf = conf.load(config);
    return conf;
};

Logger.prototype.use = function(fn) {
    if (!_.isFunction(fn)) {
        throw new Error('invalid transport for using with logger!');
    }

    var transports = this.used || [];

    transports.push(fn);

    this.used = transports;
    return this;
};

Logger.prototype.transports = {
    file: function(logfile) {
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

        return function(obj) {
            var message = printf.apply(null, _.flatten([
                '[%s] %s - %s\n',
                new Date(obj.timestamp),
                obj.level,
                obj.message
            ]));

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
    },
    console: function(config) {
        var conf = new Conf('transport:console', ['theme'])
        .defaults({
            theme: {
                info: 'green',
                warn: 'yellow',
                debug: 'grey',
                error: 'redBG'
            }
        });

        if (_.isPlainObject(config)) {
            conf.load(config);
        }

        conf.on('onValueChanged:theme', function(args) {
            colors.setTheme(args.newValue);
        });

        return function(obj) {
            var message = printf.apply(null, _.flatten([
                '[%s] %s - %s\n',
                new Date(obj.timestamp),
                obj.level[obj.level],
                obj.message
            ]));

            console.log(message);
        };
    }
};

Logger.prototype.log = function(level, message) {
    var args = _.toArray(arguments).slice(2)
        , logfile = this.logfile;

    var obj = {
        timestamp: new Date().getTime(),
        level: level,
        message: printf.apply(null, _.flatten([message, args]))
    };

    transports = this.used || [];
    _.forEach(transports, function(transport) {
        transport.apply(this, [obj]);
    }, this);

    return this;
};

Logger.prototype.error = function(message) {
    var args = _.toArray(arguments).slice(1);

    this.log.apply(null, _.flatten(['error', message, args]));

    return this;
};
