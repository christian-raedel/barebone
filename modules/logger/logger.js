var _ = require('lodash')
    , printf = require('util').format
    , fs = require('fs')
    , colors = require('colors')
    , q = require('q')
    , Conf = require('../conf');

module.exports = Logger;

function Logger(config) {
    var conf = this.config(config);

    this.conf = conf;

    return this;
};

Logger.prototype.config = function(config) {
    var def = {
        transport: 'console',
        theme: {
            info: 'green',
            warn: 'yellow',
            debug: 'grey',
            error: 'redBG'
        },
        logfile: null
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('Logger', [
        'transport',
        'theme',
        'logfile'
    ])
    .defaults(def);

    var self = this;
    conf.on('onValueChanged:theme', function(args) {
        colors.setTheme(args.newValue);
    });

    conf.on('onValueChanged:transport', function(args) {
        var logfile;

        switch (args.newValue) {
            case 'json':
                logfile = [];
            break;
            default:
                logfile = null;
        }

        this.logfile = logfile;
    });

    conf.on('onValueChanged:logfile', function(args) {
        if (args.oldValue && self.logfile) {
            self._closefile();
        }

        var logfile = null;
        if (args.newValue) {
            logfile = self._openfile(args.newValue);
        }

        self.logfile = logfile;
    });

    this.conf = conf.load(config);
    return conf;
};

Logger.prototype._openfile = function(filename) {
    var logfile = null;

    logfile = fs.createWriteStream(filename, {
        flags: 'a',
        encoding: 'utf8'
    });

    logfile.on('error', function(err) {
        throw err;
    });

    logfile.write(this._format('info', 'logfile opened...'));

    return logfile;
};

Logger.prototype._closefile = function() {
    var defer = q.defer()
        , logfile = this.logfile;

    logfile.on('finish', function() {
        defer.resolve(true);
    });

    logfile.on('error', function(err) {
        defer.reject(err);
    });

    logfile.end(this._format('info', 'logfile closed...'));
    this.logfile = null;

    return defer.promise;
};

Logger.prototype.shutdown = function() {
    return this._closefile();
};

Logger.prototype.log = function(level, message) {
    var args = _.toArray(arguments).slice(2)
        , logfile = this.logfile;

    var jsonObj = {
        timestamp: new Date().getTime(),
        level: level,
        message: printf.apply(null, _.flatten([message, args]))
    };

    message = this._format.apply(null, _.flatten([level, message, args]));

    switch (this.conf.get('transport')) {
        case 'file':
            logfile.write(message + '\n');
            break;
        case 'json':
            logfile.push(jsonObj);
        default:
            console.log(message[level] + '\n');
    }

    return this;
};

Logger.prototype.error = function(message) {
    var args = _.toArray(arguments).slice(1);

    this.log.apply(null, _.flatten(['error', message, args]));

    return this;
};

Logger.prototype._format = function(level, message) {
    var args = _.toArray(arguments).slice(2);

    var date = new Date().toLocaleTimeString();
    message = printf.apply(null, _.flatten(['[%s] %s - ' + message, date, level, args]));

    return message;
};
