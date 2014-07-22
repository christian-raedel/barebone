module.exports.echoService = function() {
    var logger = this.logger
        , session = this.session
        , curie = this.conf.get('curie');

    session.then(function(session) {
        session.register(curie + ':echo', function(args) { return args; })
        .then(function(registration) {
            logger.info('\t[%s] registered successfully', registration.procedure);
        })
        .catch(function(reason) {
            logger.error('\t%s', reason);
        });
    });
};
