var expect = require('chai').expect
    , RestServer = require('../../modules/barebone/rest-server');

describe('RestServer', function() {
    var restServer = null;

    after(function() {
        restServer.close();
    });

    it('should instantiates a new RestServer', function() {
        try {
            restServer = new RestServer({port: 9088});
            expect(restServer).to.be.an.instanceof(RestServer);
            expect(restServer.conf.get('port')).to.be.equal(9088);
        } catch (err) {
            expect(err).to.be.not.ok;
        }
    });

    it('should load server plugins', function() {
        restServer.conf.set('plugins', __dirname + '/api');
        restServer.loadApi();
    });
});
