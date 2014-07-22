var _ = require('lodash')
    , expect = require('chai').expect
    , fs = require('fs')
    , printf = require('util').format
    , log = require('../../../modules/logger');

describe('Logger', function() {
    var logger = null;

    it('should instanciates', function() {
        logger = new log.Logger();
        expect(logger).to.be.an.instanceof(log.Logger);
    });

    it('should logs a message to a logfile', function(done) {
        this.timeout(5000);

        var filename = __dirname + '/test.log';
        logger.use(log.Transports.logfile({
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

    it('should logs a message to stdout', function() {
        var logs = []
            , message = 'testlog';

        var unhook = log.hookStdout(function(string) {
            logs.push(string);
        });

        logger.used = [];
        logger.use(log.Transports.console());
        logger.info(message);
        expect(logs[0]).to.match(/testlog/);

        unhook();
    });

    it('should handles custom transport', function() {
        logger.used = [];

        function customTransport() {
            var args = _.toArray(arguments);

            var time = new Date(args.shift())
                , name = args.shift()
                , level = args.shift();

            expect(time).to.be.an.instanceof(Date);
            expect(name).to.be.equal('LOGGER');
            expect(level).to.be.equal('error');
            expect(printf.apply(null, args)).to.be.equal('dlc');
        }

        logger.use(customTransport);
        logger.error('%sl%s', 'd', 'c');
    });
});
