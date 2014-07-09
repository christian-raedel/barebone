var _ = require('lodash')
    , autobahn = require('autobahn')
    , q = require('q')
    , fs = require('fs')
    , Conf = require('./conf');

module.exports = exports = Server;

function Server(config) {
    var conf = new Conf('Server', ['url', 'realm', 'domain', 'curie', 'plugins']).load(config)
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

    this.conf = conf;
    this.conn = conn;
    this.session = defer.promise;
}

Server.prototype.connect = function() {
    this.conn.open();
    return this;
};

Server.prototype.loadPlugins = function() {
    var session = this.session
        , conf = this.conf
        , dir = conf.get('plugins') + '/';

    if (!fs.existsSync(dir)) {
        throw new Error('plugin directory "' + dir + '" does not exists!');
    }

    _.forEach(fs.readdirSync(dir), function(filename) {
        var module = require(dir + filename);
        _.forOwn(module, function(fn) {
            if (typeof fn === 'function') {
                fn(session, conf.get('curie'));
            }
        });
    });

    return this;
}
