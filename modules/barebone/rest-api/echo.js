module.exports.echo = function() {
    var conf = this.conf
        , server = this.server;

    server.get(conf.get('basePath') + '/echo/:message', function(req, res, next) {
        res.write(req.params.message);
    });

    console.log('\techo service loaded');
};
