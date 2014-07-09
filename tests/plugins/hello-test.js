module.exports.helloWorldTest = function(session, curie) {
    function fn(args) {
        return [args[0]];
    }

    session.then(function(session) {
        session.register(curie + ':hello-test', fn)
        .then(function(registration) {
            console.log(registration.procedure + ' registered successfully');
        });
    });
};
