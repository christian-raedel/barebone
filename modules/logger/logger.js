var _ = require('lodash')
    , printf = require('util').format
    , fs = require('fs')
    , console = require('console')
    , colors = require('colors')
    , FsActions = require('../fs-actions')
    , fsActions = new FsActions()
    , Conf = require('../conf');

module.exports.Logger = Logger;

function Logger(config) {
    var conf = this.config(config);

    this.conf = conf;

    return this;
};

Logger.prototype.config = function(config) {
    var def = {
        name: 'LOGGER',
        plugins: __dirname + '/transports'
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('Logger', [
        'name',
        'plugins'
    ])
    .defaults(def);

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

Logger.prototype.log = function(level, message) {
    var args = _.toArray(arguments);

    args.unshift(this.conf.get('name'));
    args.unshift(new Date().getTime());

    transports = this.used || [];
    _.forEach(transports, function(transport) {
        transport.apply(this, args);
    }, this);

    return this;
};

Logger.prototype.info = function() {
    var args = _.toArray(arguments);
    args.unshift('info');
    return this.log.apply(this, args);
};

Logger.prototype.warn = function(message) {
    var args = _.toArray(arguments);
    args.unshift('warn');
    return this.log.apply(this, args);
};

Logger.prototype.debug = function(message) {
    var args = _.toArray(arguments);
    args.unshift('debug');
    return this.log.apply(this, args);
};

Logger.prototype.error = function(message) {
    var args = _.toArray(arguments);
    args.unshift('error');
    return this.log.apply(this, args);
};

module.exports.Transports = loadTransports(__dirname + '/transports');

function loadTransports(pluginsdir) {
    var transports = {};

    function load(filename) {
        var module = require(filename);

        _.forOwn(module, function(transport, name) {
            transports[name] = transport;
        });
    }

    fsActions.readDirAndExecuteSync(pluginsdir, new RegExp('.*\.js$'), load, this);

    return transports;
};

/***
 * example: to hook stdout, call "var unhookStream = _hookStream(process.stdout, function(string, encoding, fd) {});"
 *          to unhook stdout, call "unhookStream();"
 ***/
module.exports._hookStream = _hookStream;

function _hookStream(stream, fn) {
    if (!_.isFunction(fn)) {
        throw new Error('invalid function to hook a stream!');
    }

    var oldWrite = stream.write;

    stream.write = fn;

    return function() {
        stream.write = oldWrite;
    };
};

module.exports.hookStdout = function(fn) {
    return _hookStream(process.stdout, fn);
};
