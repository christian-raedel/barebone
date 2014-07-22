var _ = require('lodash')
    , printf = require('util').format
    , colors = require('colors')
    , Conf = require('../../conf')
    , installHookTo = require('../hooks').installHookTo;

module.exports.console = function(config) {
    config = config || {};

    var conf = new Conf('transport:console', ['theme'])
    .defaults({
        theme: {
            INFO: 'green',
            WARN: 'yellow',
            DEBUG: 'grey',
            ERROR: 'redBG'
        }
    });

    conf.on('onValueChanged:theme', function(args) {
        colors.setTheme(args.newValue);
    });

    if (_.isPlainObject(config)) {
        conf.load(config);
    }

    return function() {
        var args = _.toArray(arguments);

        var time = new Date(args.shift())
            , name = args.shift()
            , level = args.shift().toUpperCase()
            , message = args.shift();

        var message = printf.apply(null, [
            '[%s] [%s] %s - %s',
            time,
            name,
            level[level],
            message
        ]);

        args.unshift(message);
        console.log.apply(null, args);
    };
};
