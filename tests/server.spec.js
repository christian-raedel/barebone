var expect = require('chai').expect
    , modules = require('../modules');

describe('Server', function() {
    it('should throws an error on invalid configuration', function() {
        var config = {
            url: 'ws://localhost:8000/bb',
            realm: 'tests',
            uri: 'de.sonnenkarma.demos.barebone.tests',
            curie: 'tbb',
        };
        expect(modules.Server.bind(modules, config)).to.throw(/plugins/);
    });

    it('should connect to application router and load plugins', function(done) {
        var config = {
            url: 'ws://localhost:8000/bb',
            realm: 'tests',
            uri: 'de.sonnenkarma.demos.barebone.tests',
            curie: 'tbb',
            plugins: __dirname + '/plugins'
        };
        modules._cache.server = null;
        var server = modules.Server(config).connect().loadPlugins();
        expect(server.session).to.be.ok;
        setTimeout(function() {
            var message = 'hello World!';
            server.session.call(config.curie + ':hello-test', [message])
            .then(function(args) {
                expect(args[0]).to.be.equal(message);
                done();
            }, done);
        }, 1000);
    });
});
