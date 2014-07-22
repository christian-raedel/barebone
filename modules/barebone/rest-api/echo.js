module.exports.echo = function() {
    var logger = this.logger
        , conf = this.conf
        , server = this.server;

    server.get(conf.get('basePath') + '/echo/:message', function(req, res, next) {
        res.write(req.params.message);
    });

    logger.info('\techo service loaded');
};
