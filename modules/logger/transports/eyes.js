var _ = require('lodash')
    , eyesOn = require('eyes').inspector();

module.exports.eyes = function() {
    return function() {
        var args = _.toArray(arguments);
        console.log(eyesOn(args));
    };
};
