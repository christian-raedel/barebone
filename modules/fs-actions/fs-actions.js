var _ = require('lodash')
    , q = require('q')
    , fs = require('fs')
    , Conf = require('../conf');

module.exports = FsActions;

function FsActions(config) {
    this.config(config);

    return this;
}

FsActions.prototype.config = function(config) {
    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = {debug: false, fsDelimiter: '/'};
    }

    this.conf = new Conf('FsActions', ['debug', 'fsDelimiter']);

    this.conf.on('onValueChanged:debug', function(args) {
        q.longStackSupport = args.newValue;
    });

    this.conf.load(config);

    if (_.isUndefined(this.conf.get('debug'))) {
        this.conf.set('debug', false);
    }

    if (_.isUndefined(this.conf.get('fsDelimiter'))) {
        this.conf.set('fsDelimiter', '/');
    }

    return this.conf;
};

FsActions.prototype.mkdir = function(dir) {
    var exists = q.denodeify(fs.exists)
        , stat = q.denodeify(fs.stat)
        , mkdir = q.denodeify(fs.mkdir);

    if (arguments.length < 1 || !_.isString(dir)) {
        defer.resolve('invalid directory argument "' + dir + '"!');
    }

    while (dir[dir.length - 1] === '/') {
        dir = dir.substr(0, dir.length - 2);
    }

    console.log('trying to create directory "' + dir + '"...');
    var dirs = dir.split('/')
        , chain = q.fcall(function() {});
    _.forEach(dirs, function(dir, idx, dirs) {
        if (idx > 0) {
            dir = dirs.slice(0, idx + 1).join('/');
            console.log(dir);

            function link() {
                return exists(dir).then(function(exists) {
                    var defer = q.defer();

                    if (!exists) {
                        mkdir(dir).then(function() {
                            console.log('directory "' + dir + '" created');
                            defer.resolve(true);
                        })
                        .catch(defer.reject);
                    } else {
                        defer.resolve(false);
                    }

                    return defer.promise;
                });
            }

            chain = chain.then(link);
        }
    });

    return chain;
};
