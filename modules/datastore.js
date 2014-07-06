var debug = require('debug')('server:datastore')
    , taffydb = require('taffydb').taffy
    , q = require('q')
    , fs = require('fs');

function DataStore(config) {
    this.log = debug;
    this.config = config;

    this.collections = {};
    if (this.config.autoLoad) {
        this.load();
    }
};

DataStore.prototype.load = function() {
    var self = this;

    fs.readdirSync(this.config.dataDir).forEach(function(filename) {
        var data = fs.readFileSync(self.config.dataDir + '/' + filename, {encoding: 'utf8'});
        var name = filename.substring(0, filename.lastIndexOf('.'));
        self.collections[name] = taffydb(data);
    });

    this.log('datastore loaded');
};

DataStore.prototype.save = function() {
    var self = this
        , defer = q.defer()
        , writeFile = q.denodeify(fs.writeFile)
        , promises = [];

    Object.keys(this.collections).forEach(function(name) {
        var data = self.collections[name]().stringify();
        promises.push(writeFile(self.config.dataDir + '/' + name + '.json', data, {encoding: 'utf8', mode: 384}));
    });

    q.all(promises)
    .then(function() {
        defer.resolve(true);
    })
    .catch(function(reason) {
        defer.reject(reason);
    })
    .finally(function() {
        self.log('datastore saved');
    });

    return defer.promise;
};

module.exports = DataStore;
