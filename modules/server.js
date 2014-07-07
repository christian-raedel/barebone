var autobahn = require('autobahn')
    , q = require('q')
    , fs = require('fs');

module.exports = exports = Server;

function Server(config) {
    this.setConf(config);

    var defer = q.defer();

    var conn = new autobahn.Connection({
        url: config.url,
        realm: config.realm,
        use_deferred: q.defer
    })

    conn.onopen = function(session) {
        console.log('connection to application router established');
        session.prefix(config.curie, config.domain);
        defer.resolve(session);
    };
    conn.onclose = function(reason, details) {
        console.log('connection to application router closed', reason, details);
        if (reason === 'unreachable') {
            defer.reject(reason);
        }
    };

    this.conn = conn;
    this.session = defer.promise;
}

Server.prototype.connect = function() {
    this.conn.open();
    return this;
};

Server.prototype.setConf = function(config) {
    ['url', 'realm', 'domain', 'curie', 'plugins'].forEach(function(key) {
        if (!config.hasOwnProperty(key) || !config[key]) {
            throw new Error('Please configure the "' + key + '" parameter.');
        }
    });

    this.conf = config;
};

Server.prototype.loadPlugins = function() {
    var session = this.session
        , config = this.conf
        , dir = config.plugins + '/';
    fs.readdirSync(dir).forEach(function(filename) {
        var module = require(dir + filename);
        Object.keys(module).forEach(function(fn) {
            if (typeof module[fn] === 'function') {
                module[fn](session, config.curie);
            }
        });
    });

    return this;
}
