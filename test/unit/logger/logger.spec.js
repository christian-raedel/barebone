var expect = require('chai').expect
    , colors = require('colors')
    , Console = require('console')
    , fs = require('fs')
    , Logger = require('../../../modules/logger');

describe('Logger', function() {
    var logger = null;

    it('should instanciates', function() {
        logger = new Logger();
        expect(logger).to.be.an.instanceof(Logger);
        expect(logger.config().get('transport')).to.be.equal('console');
        colors.setTheme(logger.config().get('theme'));
    });

    it('should evaluates formatstrings', function() {
        var message = logger._format('warn', '%sl%s', 'd', 'c');
        expect(message.substr(message.indexOf('- ') + 2, message.length)).to.be.equal('dlc');
    });

    it('should logs a message to a logfile', function(done) {
        var filename = __dirname + '/test.log';
        logger.config().set('transport', 'file');
        logger.config().set('logfile', filename);
        logger.log('error', 'test%serror', '123');
        logger.shutdown().then(function(closed) {
            expect(closed).to.be.true;
            var data = fs.readFileSync(filename, {encoding: 'utf8'});
            expect(data).to.match(/test123error/);
            fs.unlinkSync(filename);
            done();
        })
        .catch(function(reason) {
            done(reason);
        });
    });
});
