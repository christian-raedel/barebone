var _ = require('lodash')
    , fs = require('fs')
    , EventEmitter = require('events').EventEmitter
    , util = require('util');

module.exports = Conf;

function Conf(name, keys) {
    if (arguments.length < 1 || !_.isString(name)) {
        throw new Error('invalid arguments. provide a "name" to create a Conf instance!');
    }

    EventEmitter.call(this);

    this.conf = {};
    this.def = {};
    this.name = name;
    this.keys = [];

    if (_.isArray(keys)) {
        this.keys = keys;
    }

    return this;
}

util.inherits(Conf, EventEmitter);

Conf.prototype.set = function(key, value) {
    if (!_.isString(key)) {
        throw new Error('provide a "key" and a "value" to set configuration in "' + this.name + '"!');
    }

    this.emit('onValueChanged:' + key, {oldValue: this.conf[key], newValue: value});
    this.emit('onValueChanged', {key: key, oldValue: this.conf[key], newValue: value});
    this.conf[key] = value;

    if (_.indexOf(this.keys, key) === -1) {
        this.addKeys(key);
    }

    this._validate();
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

    if (_.isUndefined(source)) {
        throw new Error('invalid source to load configuration "' + this.name + '"!');
    }

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

    _.forOwn(conf, function(value, key) {
        this.emit('onValueChanged:' + key, {oldValue: null, newValue: value});
        this.emit('onValueChanged', {key: key, oldValue: null, newValue: value});
    }, this);

    this.conf = this._validate(conf);
    this.emit('onConfigLoaded', {
        source: source,
        config: this.conf
    });
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
        target = _.merge(target, conf);
        this.emit('onConfigSaved', {target: target});
        return target;
    }

    try {
        fs.writeFileSync(filename, JSON.stringify(conf), {encoding: 'utf8'});
    } catch (err) {
        throw new Error('cannot write configuration "' + this.name + '" to file "' + filename + '"!');
    }

    this.emit('onConfigSaved', {target: filename});
    return true;
};

Conf.prototype.defaults = function(defaults, value) {
    if (_.isUndefined(defaults)) {
        throw new Error('invalid arguments to setting default values for configuration "' + this.name + '"!');
    }

    if (_.isPlainObject(defaults)) {
        this.def = defaults;
        this.addKeys.apply(this, Object.keys(defaults));
    }

    if (_.isString(defaults) && !_.isUndefined(value)) {
        this.def[defaults] = value;
        this.addKeys(defaults);
    }

    return this;
};

Conf.prototype._validate = function(conf) {
    if (_.isUndefined(conf)) {
        conf = this.conf;
    }

    if (_.isEmpty(conf)) {
        throw new Error('configuration "' + this.name + '" is empty!');
    }

    _.forEach(this.keys, function(key) {
        if (_.isUndefined(conf[key])) {
            if (_.isUndefined(this.def[key])) {
                throw new Error('value of "' + key + '" in configuration "' + this.name + '" is undefined!');
            }
            this.emit('onValueChanged:' + key, {oldValue: conf[key], newValue: this.def[key]});
            this.emit('onValueChanged', {key: key, oldValue: conf[key], newValue: this.def[key]});
            conf[key] = this.def[key];
        }
    }, this);

    return conf;
};

Conf.prototype.addKeys = function(args) {
    if (_.isUndefined(args)) {
        return this;
    }

    if (arguments.length > 1) {
        args = _.toArray(arguments).slice();
        args = _.flatten(args);
    }

    var keys = this.keys.slice();

    if (_.isArray(args)) {
        keys = _.union(keys, args);
    }

    if (_.isString(args) && _.indexOf(keys, args) === -1) {
        keys.push(args);
    }

    if (_.difference(keys, this.keys).length > 0) {
        keys = keys.sort();
        this.emit('onKeysChanged', {
            oldKeys: this.keys,
            newKeys: keys,
            changedKey: args
        });
        this.keys = keys;
    }

    return this;
};

Conf.prototype.removeKeys = function(args) {
    if (_.isUndefined(args)) {
        return this;
    }

    if (arguments.length > 1) {
        args = _.toArray(arguments).slice();
        args = _.flatten(args);
    }

    var keys = this.keys.slice();

    if (_.isArray(args)) {
        keys = _.difference(keys, args);
    }

    if (_.isString(args)) {
        var idx = _.indexOf(keys, args);
        if (idx > -1) {
            keys.splice(idx, 1);
        }
    }

    if (_.difference(this.keys, keys).length > 0) {
        keys = keys.sort();
        this.emit('onKeysChanged', {
            oldKeys: this.keys,
            newKeys: keys,
            changedKey: args
        });
        this.keys = keys;
    }

    return this;
};
