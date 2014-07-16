var expect = require('chai').expect
    , WampServer = require('../../../modules/barebone').WampServer;

describe('WampServer', function() {
    it('should throws an error on invalid configuration', function() {
        try {
            new WampServer({});
        } catch (err) {
            expect(err).to.be.ok;
        }
    });

    var server = null;

    it('should connect to application router and load plugins', function(done) {
        //this.timeout(0);

        function catch_done(reason) {
            done(new Error(reason));
        }

        var config = {
            url: 'ws://localhost:8000/bb',
            realm: 'tests',
            domain: 'de.sonnenkarma.demos.barebone.tests',
            curie: 'tbb',
            plugins: __dirname + '/wamp-plugins'
        };

        server = new WampServer(config).connect().loadPlugins();
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

    it('should shutdown server within given time', function(done) {
        this.timeout(5000);

        server.shutdown(3000).then(function(reason) {
            console.log(reason);
            expect(reason).to.be.ok;
            done();
        })
        .catch(function(reason) {
            done(reason);
        });
    });
});
