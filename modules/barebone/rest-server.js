var _ = require('lodash')
    , restify = require('restify')
    , path = require('path')
    , q = require('q')
    , FsActions = require('../fs-actions')
    , logging = require('../logger')
    , Conf = require('../conf');

module.exports = RestServer;

function RestServer(config) {
    var conf = this.config(config);
    var logger = new logging.Logger({name: 'REST'}).use(logging.Transports.console());

    var server = restify.createServer();
    var port = conf.get('port');

    server.listen(port, function() {
        logger.info('server listen on port [%d]', port);
    });

    this.server = server;
    this.conf = conf;
    this.logger = logger;

    return this;
}

RestServer.prototype.config = function(config) {
    var def = {
        port: 3000,
        plugins: __dirname + '/plugins',
        basePath: '/api/'
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('RestServer', [
        'port',
        'plugins',
        'basePath'
    ])
    .defaults(def);

    this.conf = conf.load(config);
    return conf;
};

RestServer.prototype.loadApi = function() {
    var conf = this.conf
        , fsActions = new FsActions();

    fsActions.readDirAndExecuteSync(conf.get('plugins'), new RegExp('.*\.js$'), function(filename) {
        _.forEach(require(filename), function(handler) {
            this.logger.info('server is loading plugin [%s]', path.basename(filename, '.js'));
            handler.apply(this);
        }, this);
    }, this);

    return this;
};

RestServer.prototype.shutdown = function(timeout) {
    var self = this
        , server = this.server;

    var close = q.fcall(function() {
        var defer = q.defer();

        server.on('close', function() {
            self.logger.warn('RestServer shutdown');
            defer.resolve(true);
        });
        server.close();

        return defer.promise;
    });

    return q.timeout(close, timeout, 'RestServer shutdown time expired!');
};
