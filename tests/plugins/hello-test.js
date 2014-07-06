module.exports.helloWorldTest = function(session, curie, datastore) {
    function fn(args) {
        return [args[0]];
    }

    session.register(curie + ':hello-test', fn);
};
