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
                return cb(null);
            }

            fs.mkdir(dir, function(err) {
                if (err) {
                    return cb(err);
                }

                return cb(null);
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

            return cb(null);
        });
    }, function(err) {
        if (err) {
            defer.reject(err);
        }

        defer.resolve(true);
    });

    return defer.promise;
};

FsActions.prototype.removeDir = function(dir) {
    var defer = q.defer()
        , del = this.conf.get('fsDelimiter');

    function remove(dir, cb) {
        if (dir[dir.length - 1] !== del) {
            dir += del;
        }

        fs.exists(dir, function(err, exists) {
            if (err) {
                return cb(err);
            }

            if (!exists) {
                return cb(new Error('directory "' + dir + '" does not exists!'));
            }

            fs.rmdir(dir, function(err) {
                if (err) {
                    return cb(err);
                }

                return cb(null);
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
        })
        .reverse();

        async.each(dirs, remove, function(err) {
            if (err) {
                return cb(err);
            }

            return cb(null);
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

        var parts = _(dir).map(dir.split(del), function(dir, idx, dirs) {
            return dirs.slice(0, idx).join(del);
        })
        .filter(parts, function(dir) {
            return dir.length === 0 ? false : true;
        })
        .value();

        _.forEach(parts, function(part) {
            if (!fs.existsSync(part)) {
                fs.mkdirSync(part);
            }
        });
    });

    return this;
};

FsActions.prototype.removeDirSync = function(dir) {
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

        var parts = _(dir).map(dir.split(del), function(dir, idx, dirs) {
            return dirs.slice(0, idx).join(del);
        })
        .filter(parts, function(dir) {
            return dir.length === 0 ? false : true;
        })
        .reverse().value();

        _.forEach(parts, function(part) {
            if (fs.existsSync(part)) {
                fs.rmdirSync(part);
            }
        });
    });

    return this;
};

FsActions.prototype.readDirAndExecuteSync = function(dir, filter, fn, context) {
    if (!_.isString(dir)) {
        throw new Error('invalid arguments to reading directory!');
    }

    if (_.isFunction(filter)) {
        fn = filter;
        filter = '.*';
    }

    if (!_.isRegExp(filter)) {
        filter = new RegExp(filter, 'gi');
    }

    if (!_.isFunction(fn) && !_.isArray(fn)) {
        throw new Error('execute target must be a function value or an array of functions!');
    }

    if (_.isFunction(fn)) {
        fn = [fn];
    }

    var del = this.conf.get('fsDelimiter');

    if (dir[dir.length - 1] !== del) {
        dir += del;
    }

    _.forEach(fs.readdirSync(dir), function(filename) {
        if (filename.match(filter)) {
            filename = dir + del + filename;
            var stats = fs.statSync(filename);

            if (stats.isFile()) {
                _.forEach(fn, function(fn) {
                    fn.apply(context, [filename]);
                });
            };
        }
    });

    return this;
};
