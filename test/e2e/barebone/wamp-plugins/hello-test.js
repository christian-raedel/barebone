module.exports.helloWorldTest = function() {
    var session = this.session
        , curie = this.conf.get('curie');

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
