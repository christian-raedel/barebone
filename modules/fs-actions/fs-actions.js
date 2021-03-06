var _ = require('lodash')
    , fs = require('fs')
    , path = require('path')
    , Conf = require('../conf');

module.exports = FsActions;

function FsActions(config) {
    var conf = this.config(config);

    this.conf = conf

    return this;
}

FsActions.prototype.config = function(config) {
    var def = {
        fsDelimiter: path.sep
    };

    if (!config) {
        if (this.conf instanceof Conf) {
            return this.conf;
        }

        config = def;
    }

    var conf = new Conf('FsActions', [
        'fsDelimiter'
    ])
    .defaults(def);

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

/***
 * executes a function for every file in a provided directory
 *
 * @param: dir [String] - directory to search in
 * @param: filter [String|RegExp] - filter filenames by this expression
 * @param: fn [Function|Array[Function]] - function(s) to execute
 * @param: context [*] - context for the function(s) to run in
 *
 * @return: [fsActions]
 ***/
FsActions.prototype.readDirAndExecuteSync = function(dir, filter, fn, context) {
    if (!_.isString(dir)) {
        throw new Error('invalid arguments to reading directory!');
    }

    if (_.isFunction(filter)) {
        fn = filter;
        filter = new RegExp('.*', 'gi');
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
        if ((_.isString(filter) && path.extname(filename) === filter) ||
            (_.isRegExp(filter) && filename.match(filter))) {
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

FsActions.prototype.findSubDirs = function(dir) {
    var del = this.conf.get('fsDelimiter');

    dir = path.resolve(__dirname, dir);
    if (dir[dir.length - 1] !== del) {
        dir += del;
    }

    var files = [];
    _.forEach(fs.readdirSync(dir), function(node) {
        try {
            node = dir + node;
            var stats = fs.statSync(node);
            if (stats.isDirectory()) {
                files.push(node);
                files = files.concat(this.findSubDirs(node));
            }
        } catch (err) {
            console.log('cannot read directory "%s". [%s]', node, err.message);
        }
    }, this);

    return files;
};
