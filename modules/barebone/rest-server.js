var _ = require('lodash')
    , restify = require('restify')
    , Conf = require('../conf');

module.exports = function RestServer(config) {
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
};

RestServer.prototype.loadApi = function() {
    var conf = this.conf;

    fs.readdirSync(config.apiDir).forEach(function(filename) {
        require(config.apiDir + '/' + filename).forEach(function(handler) {
            self.server = handler(self.server);
        });
        self.log('plugin: [' + filename + '] loaded');
    });

    return this.server;
};
