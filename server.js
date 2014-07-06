var modules = require('./modules');

modules.WampServer.connect({
    url: 'ws://127.0.0.1:3000/bb',
    realm: 'demos',
    uri: 'de.sonnenkarma.demos.barebone',
    curie: 'bb',
    pluginDir: __dirname + '/modules/wamp-plugins',
    datastore: new modules.DataStore({
        dataDir: __dirname + '/data',
        autoLoad: true
    })
})
.then(modules.WampServer.loadPlugins)
.catch(function(reason) {
    throw new Error(reason);
})
.finally(function() {
    console.log('barebone server started');
});
