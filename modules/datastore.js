var _ = require('lodash')
    , taffydb = require('taffydb').taffy
    , q = require('q')
    , fs = require('fs')
    , Conf = require('./conf');

module.exports = DataStore;

function DataStore(config) {
    this.conf = new Conf('DataStore', ['datadir', 'autoLoad']).load(config);

    this.collections = {};
    if (this.conf.get('autoLoad')) {
        this.loadData();
    }

    return this;
};

DataStore.prototype.loadData = function() {
    var self = this
        , conf = this.conf;

    _.forEach(fs.readdirSync(conf.get('datadir')), function(filename) {
        var data = fs.readFileSync(conf.get('datadir') + '/' + filename, {encoding: 'utf8'});
        var name = filename.substring(0, filename.lastIndexOf('.'));
        self.collections[name] = taffydb(data);
    });

    return this;
};

DataStore.prototype.saveData = function() {
    var self = this
        , conf = this.conf
        , defer = q.defer()
        , writeFile = q.denodeify(fs.writeFile)
        , promises = [];

    _.forOwn(this.collections, function(collection, name) {
        var data = collection().stringify();
        promises.push(writeFile(conf.get('datadir') + '/' + name + '.json', data, {encoding: 'utf8', mode: 384}));
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
