var expect = require('chai').expect
    , fs = require('fs');

describe('Conf', function() {
    var Conf = require('../conf');

    it('should requires module', function() {
        expect(Conf).to.be.ok;
    });

    it('should instantiates', function() {
        var conf = new Conf('testConfig');
        expect(conf).to.be.an.instanceof(Conf);
    });

    it('should throws an error if no configuration name is provided', function() {
        try {
            var conf = new Conf();
        } catch (err) {
            expect(err).to.be.an.instanceof(Error);
        }
    });

    it('should set and get configuration key/value-pairs', function() {
        var conf = new Conf('testConfig').set('keyA', 'valueA').set('keyB', 'valueB');
        expect(conf).to.be.an.instanceof(Conf);
        var valueB = conf.get('keyB');
        expect(valueB).to.be.equal('valueB');
    });

    it('should throws an error on invalid key/value-pairs', function() {
        var conf = new Conf('testConfig', ['keyA', 'keyB']);
        expect(conf).to.be.an.instanceof(Conf);
        expect(conf.get.bind(conf, 'keyA')).to.throw(Error);
    });

    it('should loads from an arguments array with commandline parameters', function() {
        var conf = new Conf('testConfig', ['paramA', 'paramB']).load(['--paramA=valueA', '-paramB valueB']);
        expect(conf).to.be.an.instanceof(Conf);
        expect(conf.conf).to.be.deep.equal({
            'paramA': 'valueA',
            'paramB': 'valueB'
        });
        var valueA = conf.get('paramA');
        expect(valueA).to.be.equal('valueA');
        var valueB = conf.get('paramB');
        expect(valueB).to.be.equal('valueB');
    });

    it('should loads from a JSON source file', function() {
        var jsonObj = {keyA: 'valueB', keyB: 'valueA'}
            , filename = __dirname + '/testConfigFile.json';
        try {
            fs.writeFileSync(filename, JSON.stringify(jsonObj), {encoding: 'utf8'});

            var conf = new Conf('jsonTestConfig', ['keyA', 'keyB']).load(filename);
            expect(conf.conf).to.be.deep.equal(jsonObj);
        } catch (err) {
            expect(err).to.be.not.ok;
        } finally {
            fs.unlinkSync(filename);
        }
    });

    it('should loads from a STRING source', function() {
        var jsonObj = {keyA: 'valueB', keyB: 'valueA'};

        var conf = new Conf('stringTestConfig', ['keyA', 'keyB']).load(JSON.stringify(jsonObj));
        expect(conf.conf).to.be.deep.equal(jsonObj);
    });

    it('should loads from an OBJECT source', function() {
        var jsonObj = {keyA: 'valueB', keyB: 'valueA'};

        var conf = new Conf('objectTestConfig', ['keyA', 'keyB']).load(jsonObj);
        expect(conf.conf).to.be.deep.equal(jsonObj);
    });

    it('should save to an OBJECT target', function() {
        var jsonObj = {keyA: 'valueB', keyB: 'valueA'}
            , targetObj = {};

        targetObj = new Conf('objectTestConfig', ['keyA', 'keyB']).load(jsonObj).save(targetObj);
        expect(targetObj).to.be.deep.equal(jsonObj);
    });

    it('should save to a JSON file', function() {
        var jsonObj = {keyA: 'valueB', keyB: 'valueA'}
            , filename = __dirname + '/saveFileTestConfig.json';

        try {
            var conf = new Conf('saveFileTestConfig', ['keyA', 'keyB']).load(jsonObj);
            var saved = conf.save(filename);
            expect(saved).to.be.true;
            var config = require(filename);
            expect(config).to.be.deep.equal(conf.conf);
        } catch (err) {
            expect(err).to.be.not.ok;
        } finally {
            fs.unlinkSync(filename);
        }
    });
});
