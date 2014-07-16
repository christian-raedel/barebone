var _ = require('lodash')
    , restify = require('restify')
    , path = require('path')
    , q = require('q')
    , FsActions = require('../fs-actions')
    , Conf = require('../conf');

module.exports = RestServer;

function RestServer(config) {
    var conf = this.config(config);

    var server = restify.createServer();
    var port = conf.get('port');

    server.listen(port, function() {
        console.log('RestServer listen on port [%d]', port);
    });

    this.server = server;
    this.conf = conf;

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
            console.log('RestServer loading plugin [%s]', path.basename(filename, '.js'));
            handler.apply(this);
        }, this);
    }, this);

    return this;
};

RestServer.prototype.shutdown = function(timeout) {
    var defer = q.defer()
        , server = this.server;

    server.on('close', function() {
        defer.resolve(true);
    });
    server.close();

    setTimeout(function() {
        defer.reject(new Error('could not shutdown RestServer within the given time!'));
    }, timeout);

    return defer.promise;
};
