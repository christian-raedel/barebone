var _ = require('lodash')
    , fs = require('fs');

module.exports = Conf;

function Conf(name, keys) {
    if (arguments.length < 1 || !_.isString(name)) {
        throw new Error('invalid arguments. provide a "name" to create a Conf instance!');
    }

    this.conf = {};
    this.name = name;
    this.keys = [];

    if (_.isArray(keys)) {
        this.keys = keys;
    }
}

Conf.prototype.set = function(key, value) {
    if (arguments.length < 2 || !_.isString(key)) {
        throw new Error('provide a "key" and a "value" to set configuration in "' + this.name + '"!');
    }

    this.conf[key] = value;

    if (_.indexOf(this.keys, key) === -1) {
        this.keys.push(key);
    }

    return this;
};

Conf.prototype.get = function(key) {
    if (arguments.length < 1 || !_.isString(key)) {
        throw new Error('provide a "key" to get configuration from "' + this.name + '"!');
    }

    if (_.indexOf(this.keys, key) === -1) {
        throw new Error('key "' + key + '" is not part of configuration "' + this.name + '"!');
    }

    if (_.isUndefined(this.conf[key])) {
        throw new Error('value of "' + key + '" in configuration "' + this.name + '" is undefined!');
    }

    return this.conf[key];
};

Conf.prototype.load = function(source) {
    var conf = {};

    if (_.isArray(source) && source.length > 0) {
        _.forEach(source, function(keyValuePair) {
            var keyValue = null;
            if (keyValuePair.lastIndexOf('=') > -1) {
                keyValue = keyValuePair.split('=');
            } else if (keyValuePair.lastIndexOf(' ') > -1) {
                keyValue = keyValuePair.split(' ');
            } else {
                throw new Error('invalid argument "' + keyValuePair + '" in ARRAY source for configuration "' + this.name + '"!');
            }

            var key = keyValue[0]
                , value = keyValue[1];
            while(key[0] === '-') {
                key = key.substr(1, key.length);
            }

            conf[key] = value;
        });
    }

    if (_.isString(source) && source.lastIndexOf('.json') === (source.length - 5)) {
        try {
            conf = require(source);
            this.filename = source;
        } catch (err) {
            throw new Error('invalid JSON source file "' + source + '" for configuration "' + this.name + '"!');
        }
    } else if (_.isString(source)) {
        try {
            conf = JSON.parse(source);
        } catch (err) {
            throw new Error('invalid STRING source for configuration "' + this.name + '"!');
        }
    }

    if (_.isPlainObject(source)) {
        try {
            conf = _.merge(this.conf, source);
        } catch (err) {
            throw new Error('invalid OBJECT source for configuration "' + this.name + '"!');
        }
    }

    this.conf = this._validate(conf);
    return this;
};

Conf.prototype.save = function(target) {
    var conf = this._validate()
        , filename = target;

    if (arguments.length < 1) {
        if (_.isUndefined(this.filename)) {
            throw new Error('provide a filename for saving configuration "' + this.name + '"!');
        }
        filename = this.filename;
    }

    if (_.isObject(target)) {
        return _.merge(target, conf);
    }

    try {
        fs.writeFileSync(filename, JSON.stringify(conf), {encoding: 'utf8'});
    } catch (err) {
        throw new Error('cannot write configuration "' + this.name + '" to file "' + filename + '"!');
    }

    return true;
};

Conf.prototype._validate = function(conf) {
    if (arguments.length < 1) {
        conf = this.conf;
    }

    if (_.isEmpty(conf)) {
        throw new Error('configuration "' + this.name + '" is empty!');
    }

    _.forEach(this.keys, function(key) {
        if (_.isUndefined(conf[key])) {
            throw new Error('value of "' + key + '" in configuration "' + this.name + '" is undefined!');
        }
    });

    return conf;
};
