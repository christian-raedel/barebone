var _ = require('lodash')
    , autobahn = require('autobahn')
    , q = require('q')
    , fs = require('fs')
    , path = require('path')
    , FsActions = require('../fs-actions')
    , Conf = require('../conf');

module.exports = WampServer;

function WampServer(config) {
    var conf = this.config(config)
        , defer = q.defer();

    var conn = new autobahn.Connection({
        url: conf.get('url'),
        realm: conf.get('realm'),
        use_deferred: q.defer
    });

    conn.onopen = function(session) {
        console.log('connection to application router established');
        session.prefix(conf.get('curie'), conf.get('domain'));
        defer.resolve(session);
    };

    conn.onclose = function(reason, details) {
        console.log('connection to application router closed', reason, details);
        if (reason === 'unreachable') {
            defer.reject(reason);
        }
    };

    this.fsActions = new FsActions();
    this.conf = conf;
    this.conn = conn;
    this.session = defer.promise;

    return this;
}

WampServer.prototype.config = function(config) {
    var def = {
        plugins: __dirname + '/plugins'
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('WampServer', [
        'url',
        'realm',
        'domain',
        'curie',
        'plugins'
    ])
    .defaults(def);

    this.conf = conf.load(config);
    return conf;
};

WampServer.prototype.connect = function() {
    this.conn.open();
    return this;
};

WampServer.prototype.shutdown = function(timeout) {
    var conn = this.conn;

    var close = q.fcall(function() {
        var defer = q.defer();

        /*
        conn.onclose = function(reason, details) {
            console.log('WampServer shutdown');
            defer.resolve(reason);
        };
        */
        conn.close();
        console.log('WampServer shutdown');
        defer.resolve(true);

        return defer.promise;
    });

    return q.timeout(close, timeout, 'WampServer shutdown time expired!');
};

WampServer.prototype.loadPlugins = function() {
    var session = this.session
        , dir = this.conf.get('plugins') + '/';

    if (!fs.existsSync(dir)) {
        throw new Error('plugin directory "%s" does not exists!', dir);
    }

    function load(filename) {
        _.forOwn(require(filename), function(fn) {
            console.log('server is loading plugin [%s]', path.basename(filename, '.js'));
            fn.apply(this);
        }, this);
    }

    this.fsActions.readDirAndExecuteSync(dir, new RegExp('.*\.js$'), load, this);

    return this;
}
