var _ = require('lodash')
    , autobahn = require('autobahn')
    , q = require('q')
    , fs = require('fs')
    , path = require('path')
    , FsActions = require('../fs-actions')
    , fsActions = new FsActions()
    , logging = require('../logger')
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

    var logger = new logging.Logger({name: 'WAMPSERVER'}).use(logging.Transports.console());

    conn.onopen = function(session) {
        logger.info('connection to application router established');
        session.prefix(conf.get('curie'), conf.get('domain'));
        defer.resolve(session);
    };

    conn.onclose = function(reason, details) {
        logger.warn('connection to application router closed', reason, details);
        if (reason === 'unreachable') {
            defer.reject(reason);
        }
    };

    this.conf = conf;
    this.conn = conn;
    this.session = defer.promise;
    this.logger = logger;

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
    var self = this
        , conn = this.conn;

    var close = q.fcall(function() {
        var defer = q.defer();

        /*
        conn.onclose = function(reason, details) {
            this.logger.info('WampServer shutdown');
            defer.resolve(reason);
        };
        */
        conn.close();
        self.logger.warn('WampServer shutdown');
        defer.resolve(true);

        return defer.promise;
    });

    return q.timeout(close, timeout, 'WampServer shutdown time expired!');
};

WampServer.prototype.loadPlugins = function() {
    var dir = this.conf.get('plugins');

    if (!fs.existsSync(dir)) {
        throw new Error('plugin directory "%s" does not exists!', dir);
    }

    function load(filename) {
        _.forOwn(require(filename), function(fn) {
            this.logger.info('server is loading plugin [%s]', path.basename(filename, '.js'));
            fn.apply(this);
        }, this);
    }

    fsActions.readDirAndExecuteSync(dir, new RegExp('.*\.js$'), load, this);

    return this;
}
