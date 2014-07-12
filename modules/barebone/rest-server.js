var _ = require('lodash')
    , restify = require('restify')
    , FsActions = require('../fs-actions')
    , Conf = require('../conf');

module.exports = RestServer;

function RestServer(config) {
    var conf = new Conf('RestServer', ['port', 'plugins'])
    .defaults({port: 3000, plugins: __dirname + '/plugins'})
    .load(config);

    var server = restify.createServer(config);
    var port = conf.get('port');

    server.listen(port, function() {
        console.log('RestServer listen on port [' + port + ']');
    });

    this.server = server;
    this.conf = conf;

    return this;
}

RestServer.prototype.loadApi = function() {
    var conf = this.conf
        , fsActions = new FsActions();

    fsActions.readDirAndExecuteSync(conf.get('plugins'), new RegExp('.*\.js$'), function(filename) {
        _.forEach(require(filename), function(handler) {
            if (!(this.server instanceof RestServer)) {
                throw new Error('invalid RestServer argument "' + this + '" for "' + filename + '"!');
            }

            this.server = handler(this.server);
            console.log('plugin "' + filename + '" loaded');
        }, this);
    }, this);

    return this.server;
};
