var _ = require('lodash');

module.exports.installHookTo = installHookTo;

function installHookTo(obj) {
    if (obj.hook || obj.unhook) {
        throw new Error('object already has properties hook and/or unhook!');
    }

    obj.hook = function(methodName, fn, isAsync) {
        var self = this
            , methodRef = null;

        if (!_.isFunction(self[methodName])) {
            throw new Error('invalid method: ' + methodName + '!');
        }

        if (self.unhook.methods[methodName]) {
            throw new Error('method already hooked: ' + methodName + '!');
        }

        methodRef = (self.unhook.methods[methodName] = self[methodName]);

        self[methodName] = function() {
            var args = _.toArray(arguments);

            while (args.length < methodRef.length) {
                args.push(undefined);
            }

            /*
            args.push(function() {
                var args = arguments;

                if (isAsync) {
                    process.nextTick(function() {
                        methodRef.apply(self, args);
                    });
                } else {
                    methodRef.apply(self, args);
                }
            });
            */

            fn.apply(self, args);
        };
    };

    obj.unhook = function(methodName) {
        var self = this
            , methodRef = self.unhook.methods[methodName];

        if (methodRef) {
            self[methodName] = self.unhook.methods[methodName];
            delete self.unhook.methods[methodName];
        } else {
            throw new Error('method not hooked: ' + methodName + '!');
        }
    };

    obj.unhook.methods = {};

    return function uninstallHookFrom() {
        if (obj.hook) {
            obj.hook = null;
        }

        if (obj.unhook) {
            obj.unhook = null;
        }
    };
};
