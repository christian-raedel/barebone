var expect = require('chai').expect
    , _ = require('lodash')
    , http = require('http')
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

    it('executes echo rest service', function(done) {
        this.timeout(5000);

        var testdata = 'dlc+cld';

        var req = http.request({hostname: '127.0.0.1', port: 9088, path: '/api/v2/echo/' + testdata}, function(res) {
            res.setEncoding('utf8');
            expect(res.statusCode).to.be.equal(200);

            res.on('data', function(chunk) {
                expect(chunk).to.be.equal(testdata);
                done();
            });
        });

        req.on('error', done);
        req.end();
    });

    it('shuts down successfully', function(done) {
        this.timeout(7000);

        server.shutdown(6000).then(function() {
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });
});
