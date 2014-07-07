var expect = require('chai').expect
    , modules = require('../modules');

describe('Server', function() {
    it('should throws an error on invalid configuration', function() {
        var config = {
            url: 'ws://localhost:8000/bb',
            realm: 'tests',
            domain: 'de.sonnenkarma.demos.barebone.tests',
            curie: 'tbb'
        };
        expect(modules.Server.bind(modules, config)).to.throw(/plugins/);
    });

    it('should connect to application router and load plugins', function(done) {
        this.timeout(0);

        function catch_done(reason) {
            done(new Error(reason));
        }

        modules.DataStore({datadir: __dirname + '/testdata'});

        var config = {
            url: 'ws://localhost:8000/bb',
            realm: 'tests',
            domain: 'de.sonnenkarma.demos.barebone.tests',
            curie: 'tbb',
            plugins: __dirname + '/plugins'
        };
        var server = modules.Server(config).connect().loadPlugins();
        server.session.then(function(session) {
            expect(session).to.be.ok;
            expect(Object.keys(session._prefixes)[0]).to.be.equal('tbb');

            var message = 'hello World!';
            session.call(config.curie + ':hello-test', [message])
            .then(function(args) {
                expect(args[0]).to.be.equal(message);
                done();
            })
            .catch(catch_done);
        })
        .catch(catch_done);
    });
});
