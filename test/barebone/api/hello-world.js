var expect = require('chai').expect
    , restify = require('restify')
    , RestServer = require('../../../modules/barebone/rest-server');

module.exports.serverUses = function(server) {
    server.use(restify.authorizationParser);
    expect(server).to.be.an.instanceof(RestServer);
};
