var _ = require('lodash')
    , q = require('q')
    , barebone = require('./modules/barebone')
    , logging = require('./modules/logger');

var logfile = logging.Transports.logfile({logfile: __dirname + '/logs/server.log'});

var logger = new logging.Logger({name: 'SERVER'})
.use(logfile)
.use(logging.Transports.console())

module.exports.datastore = datastore;
var datastore = new barebone.DataStore({
    dataDir: __dirname + '/data',
    autoLoad: true
});

module.exports.wampServer = wampServer;
var wampServer = new barebone.WampServer({
    url: 'ws://127.0.0.1:3000/bb',
    realm: 'demos',
    domain: 'de.sonnenkarma.demos.barebone',
    curie: 'bb',
    plugins: __dirname + '/modules/barebone/wamp-plugins',
    datastore: datastore
});

wampServer.logger.use(logfile);

wampServer.loadPlugins().connect()
.session.catch(function(reason) {
    throw new Error(reason);
});

module.exports.restServer = restServer;
var restServer = new barebone.RestServer({
    port: 9088,
    basePath: '/api/v2',
    plugins: __dirname + '/modules/barebone/rest-api'
});

restServer.logger.use(logfile);

restServer.loadApi();

module.exports.shutdown = shutdown;
function shutdown(timeout) {
    return q.all([
        wampServer.shutdown(timeout),
        restServer.shutdown(timeout)
    ]);
};
