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
        colors.setTheme(logger.config().get('theme'));
    });

    it('should logs a message to a logfile', function(done) {
        this.timeout(5000);

        var filename = __dirname + '/test.log';
        logger.use(logger.fileTransport({
            logfile: filename,
            autoClose: 0
        }));
        logger.log('error', 'test%serror', '123');
        setTimeout(function() {
            var data = fs.readFileSync(filename, {encoding: 'utf8'});
            expect(data).to.match(/test123error/);
            fs.unlinkSync(filename);
            done();
        }, 2000);
    });
});
