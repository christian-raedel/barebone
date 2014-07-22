var expect = require('chai').expect
    , _ = require('lodash')
    , autobahn = require('autobahn');

describe('Barebone', function() {
    var server = null;

    it('should requires the server module', function() {
        server = require('../../../server');
        expect(server).to.be.ok;
    });

    it('executes echo wamp service', function(done) {
        this.timeout(5000);

        var conn = new autobahn.Connection({
            url: 'ws://127.0.0.1:3000/bb',
            realm: 'demos'
        });

        conn.onopen = function(session) {
            session.prefix('bb', 'de.sonnenkarma.demos.barebone');

            var testdata = ['dlc', 'cld'];
            session.call('bb:echo', testdata).then(function(args) {
                expect(args).to.be.deep.equal(testdata);
                done();
            })
            .catch(function(reason) {
                done(new Error(reason));
            });
        };
        conn.open();
    });

    it('shuts down successfully', function(done) {
        this.timeout(5000);

        server.shutdown(3000).then(function() {
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });
});
