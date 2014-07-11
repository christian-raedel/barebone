var _ = require('lodash')
    , q = require('q')
    , async = require('async')
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

    this.conf = conf.load(config);
    return conf;
};

FsActions.prototype.createDir = function(dir) {
    var defer = q.defer()
        , del = this.conf.get('fsDelimiter');

    function create(dir, cb) {
        if (dir[dir.length - 1] !== del) {
            dir += del;
        }

        fs.exists(dir, function(err, exists) {
            if (err) {
                return cb(err);
            }

            if (exists) {
                return cb(null, true);
            }

            fs.mkdir(dir, function(err) {
                if (err) {
                    return cb(err);
                }

                return cb(null, true);
            });
        });
    }

    if (_.isString(dir)) {
        dir = [dir];
    }

    async.each(dir, function(dir, cb) {
        var dirs = _(dir).map(dir.split(del), function(dir, idx, dirs) {
            return dirs.slice(0, idx).join(del);
        })
        .filter(dirs, function(dir) {
            return dir.length === 0 ? false : true;
        });

        async.each(dirs, create, function(err) {
            if (err) {
                return cb(err);
            }

            return cb(null, true);
        });
    }, function(err) {
        if (err) {
            defer.reject(err);
        }

        defer.resolve(true);
    });

    return defer.promise;
};

FsActions.prototype.createDirSync = function(dir) {
    if (!dir) {
        throw new Error('invalid arguments to creating directories!');
    }

    var del = this.conf.get('fsDelimiter');

    if (_.isString(dir)) {
        dir = [dir];
    }

    _.forEach(dir, function(dir) {
        if (dir[dir.length - 1] !== del) {
            dir += del;
        }

        var parts = _.map(dir.split(del), function(dir, idx, dirs) {
            return dirs.slice(0, idx).join(del);
        });
        parts = _.filter(parts, function(dir) {
            return dir.length === 0 ? false : true;
        });

        _.forEach(parts, function(part) {
            if (!fs.existsSync(part)) {
                fs.mkdirSync(part);
            }
        });
    });

    return this;
};
