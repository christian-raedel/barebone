var expect = require('chai').expect
    , RestServer = require('../../../modules/barebone').RestServer;

describe('RestServer', function() {
    var restServer = null;

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
        restServer.conf.set('plugins', __dirname + '/rest-api');
        restServer.loadApi();
    });

    it('should shutdown the server within a given time', function(done) {
        this.timeout(10000);

        restServer.shutdown(2000).then(function(down) {
            expect(down).to.be.true;
            done();
        })
        .catch(function(reason) {
            done(reason);
        });
    });
});
