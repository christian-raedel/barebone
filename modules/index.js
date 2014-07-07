var DataStore = require('./datastore')
    , Server = require('./server');

module.exports = {
    _cache: {
        datastore: null,
        server: null
    },
    DataStore: function(config) {
        if (!this._cache.datastore && config) {
            this._cache.datastore = new DataStore(config);
        }

        if (!this._cache.datastore && !config) {
            throw new Error('datastore configuration required!');
        }

        return this._cache.datastore;
    },
    Server: function(config) {
        if (!this._cache.server && config) {
            this._cache.server = new Server(config);
        }

        if (!this._cache.server && !config) {
            throw new Error('server configuration required!');
        }

        return this._cache.server;
    }
}
