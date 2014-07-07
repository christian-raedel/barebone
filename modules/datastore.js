var taffydb = require('taffydb').taffy
    , q = require('q')
    , fs = require('fs');

module.exports = DataStore;

function DataStore(config) {
    this.setConf(config);

    this.collections = {};
    if (this.conf.autoLoad) {
        this.loadData();
    }
};

DataStore.prototype.setConf = function(config) {
    ['datadir'].forEach(function(key) {
        if (!config.hasOwnProperty(key) || !config[key]) {
            throw new Error('Please configure the "' + key + '" parameter.');
        }
    });

    this.conf = config;
};

DataStore.prototype.loadData = function() {
    var self = this
        , config = this.conf;

    fs.readdirSync(config.datadir).forEach(function(filename) {
        var data = fs.readFileSync(config.datadir + '/' + filename, {encoding: 'utf8'});
        var name = filename.substring(0, filename.lastIndexOf('.'));
        self.collections[name] = taffydb(data);
    });

    return this;
};

DataStore.prototype.saveData = function() {
    var self = this
        , config = this.conf
        , defer = q.defer()
        , writeFile = q.denodeify(fs.writeFile)
        , promises = [];

    Object.keys(this.collections).forEach(function(name) {
        var data = self.collections[name]().stringify();
        promises.push(writeFile(config.datadir + '/' + name + '.json', data, {encoding: 'utf8', mode: 384}));
    });

    q.all(promises)
    .then(function() {
        defer.resolve(true);
    })
    .catch(function(reason) {
        defer.reject(reason);
    })
    .finally(function() {
        console.log('datastore saved');
    });

    return defer.promise;
};
