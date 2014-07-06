var DataStore = require('./datastore')
    , Server = require('./server');

var datastore = null
    , server = null;

module.exports = {
    _cache: {
        datastore: null,
        server: null
    },
    DataStore: function(config) {
        if (!this._cache.datastore) {
            this._cache.datastore = new DataStore(config);
        }

        return this._cache.datastore;
    },
    Server: function(config) {
        if (!this._cache.server) {
            this._cache.server = new Server(config);
        }

        return this._cache.server;
    }
}
