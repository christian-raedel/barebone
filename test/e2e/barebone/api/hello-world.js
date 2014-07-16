var expect = require('chai').expect
    , restify = require('restify')
    , RestServer = require('../../../../modules/barebone/rest-server');

module.exports.serverUses = function() {
    var server = this.server;

    server.use(restify.authorizationParser);
    expect(this).to.be.an.instanceof(RestServer);
};
