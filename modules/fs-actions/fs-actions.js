var _ = require('lodash')
    , eyesOn = require('eyes').inspector({styles: {all: 'magenta'}})
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

        var parts = this._makePathsArray(dir);

        _.forEach(parts, function(part) {
            if (!fs.existsSync(part)) {
                fs.mkdirSync(part);
            }
        });
    }, this);

    return this;
};

FsActions.prototype.removeDir = function(dir) {
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

        if (fs.existsSync(dir)) {
            _.forEach(fs.readdirSync(dir), function(filename) {
                filename = dir + del + filename;
                var stats = fs.statSync(filename);
                if (stats.isDirectory()) {
                    this.removeDir(filename);
                } else {
                    fs.unlinkSync(filename);
                }
            }, this);

            fs.rmdirSync(dir);
        }
    }, this);

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

FsActions.prototype._makePathsArray = function(dir) {
    var del = this.conf.get('fsDelimiter');

    return _(dir.split(del)).map(function(dir, idx, dirs) {
        return dirs.slice(0, idx).join(del);
    })
    .filter(function(dir) {
        return dir.length === 0 ? false : true;
    })
    .value();
};
