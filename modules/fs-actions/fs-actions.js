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
    var def = {debug: false, fsDelimiter: '/'};

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('FsActions', ['debug', 'fsDelimiter']).defaults(def);

    conf.on('onValueChanged:debug', function(args) {
        q.longStackSupport = args.newValue;
        console.log('Q\'s longStackSupport is ' + (q.longStackSupport ? 'enabled' : 'disabled'));
    });

    conf.load(config);
    this.conf = conf;

    return conf;
};

FsActions.prototype.mkdir = function(dir) {
    var exists = q.denodeify(fs.exists)
        , stat = q.denodeify(fs.stat)
        , mkdir = q.denodeify(fs.mkdir);

    if (!_.isString(dir)) {
        throw new Error('invalid directory argument "' + dir + '"!');
    }

    var del = this.conf.get('fsDelimiter');
    while (dir[dir.length - 1] === del) {
        dir = dir.substr(0, dir.length - 2);
    }

    console.log('trying to create directory "' + dir + '"...');
    var dirs = dir.split(del)
        , chain = q.fcall(function() {});
    _.forEach(dirs, function(dir, idx, dirs) {
        if (idx > 0) {
            dir = dirs.slice(0, idx + 1).join(del);
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
