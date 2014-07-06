var debug = require('debug')('server:rest-server')
    , restify = require('restify');

module.exports = function RestServer(config) {
    this.log = debug;

    var self = this
        , server = restify.createServer(config);

    server.listen(config.port || 3000, function() {
        self.log('listen on port [' + config.port + ']');
    });

    this.server = server;
    return server;
};

RestServer.prototype.loadApi = function(config) {
    var self = this;

    fs.readdirSync(config.apiDir).forEach(function(filename) {
        require(config.apiDir + '/' + filename).forEach(function(handler) {
            self.server = handler(self.server);
        });
        self.log('plugin: [' + filename + '] loaded');
    });

    return this.server;
};
