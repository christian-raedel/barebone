var _ = require('lodash')
    , taffydb = require('taffydb').taffy
    , q = require('q')
    , fs = require('fs')
    , path = require('path')
    , Conf = require('../conf')
    , FsActions = require('../fs-actions');

module.exports = DataStore;

function DataStore(config) {
    this.config(config);
    this.fsActions = new FsActions();

    this.collections = {};
    if (this.conf.get('autoLoad')) {
        this.loadData();
    }

    return this;
};

DataStore.prototype.config = function(config) {
    var def = {
        datadir: './data',
        autoLoad: true,
        fileExt: '.json'
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('DataStore', [
        'datadir',
        'autoLoad',
        'fileExt',
    ]).defaults(def);

    this.conf = conf.load(config);
    return conf;
};

DataStore.prototype.loadData = function() {
    var conf = this.conf;

    function load(filename) {
        var data = fs.readFileSync(filename, {encoding: 'utf8'});
        var name = path.basename(filename, path.extname(filename));
        this.collections[name] = taffydb(data);
    }

    this.fsActions.readDirAndExecuteSync(conf.get('datadir'), conf.get('fileExt'), load, this);

    return this;
};

DataStore.prototype.saveData = function() {
    var conf = this.conf
        , defer = q.defer()
        , writeFile = q.denodeify(fs.writeFile)
        , promises = [];

    var fileExt = conf.get('fileExt');
    if (fileExt[0] !== '.') {
        fileExt = '.' + fileExt;
    }

    _.forOwn(this.collections, function(collection, name) {
        var data = collection().stringify();
        promises.push(writeFile(conf.get('datadir') + '/' + name + fileExt, data, {encoding: 'utf8', mode: 384}));
    });

    q.all(promises)
    .then(function() {
        defer.resolve(true);
    })
    .catch(function(reason) {
        defer.reject(reason);
    })
    .finally(function() {
        console.log('\tdatastore saved');
    });

    return defer.promise;
};
