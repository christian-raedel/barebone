var autobahn = require('autobahn')
    , q = require('q')
    , fs = require('fs')
    , modules = require('./index');

module.exports = exports = Server;

function Server(config) {
    this.setConf(config);

    var conn = new autobahn.Connection({
        url: config.url,
        realm: config.realm,
        use_deferred: q.defer
    })

    conn.onopen = function(session) {
        console.log('connection to application router established');
        session.prefix(config.curie, config.domain);
        this.session = session;
    };
    conn.onclose = function(reason, details) {
        console.log('connection to application router closed', reason, details);
        this.session = null;
    };

    this.conn = conn;
}

Server.prototype.connect = function() {
    var self = this;
    var timeout = setTimeout(function() {
        if (self.session) {
            clearTimeout(timeout);
            return self;
        } else {
            return Server.prototype.connect.apply();
        }
    }, 500);
};

Server.prototype.setConf = function(config) {
    ['url', 'realm', 'uri', 'curie', 'plugins'].forEach(function(key) {
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
            if (typeof fn === 'function') {
                fn(session, config.curie, modules.DataStore());
            }
        });
    });

    return this;
}
