var chai = require('chai')
    , spies = require('chai-spies');

chai.use(spies);

var expect = chai.expect
    , fs = require('fs')
    , Conf = require('../../modules/conf');

describe('Conf', function() {
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
        var conf = new Conf('testConfig', ['paramB'])
        .defaults('paramA', true)
        .load(['--paramA=valueA', '-paramB valueB']);
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

    it('should emits on value changed', function() {
        var conf = new Conf('eventsConfig', ['keyA', 'keyB']);

        function onKeyBChanged(args) {
            expect(args, 'onKeyBChanged').to.be.ok;
            expect(args.oldValue, 'oldValue').to.be.not.ok;
            expect(args.newValue, 'newValue').to.be.equal(43);
        }
        var spyA = chai.spy(onKeyBChanged);
        conf.on('onValueChanged:keyB', spyA);

        function onValueChanged(args) {
            expect(args).to.be.ok;
            expect(args.key).to.be.equal('keyB');
        }
        var spyB = chai.spy(onValueChanged);
        conf.on('onValueChanged', spyB);

        conf.set('keyB', 43);
        expect(spyA).to.have.been.called.once();
        expect(spyB).to.have.been.called.once();
    });

    it('should emits on loading and saving', function() {
        var jsonObj = {keyA: 'valueB', keyB: 'valueA'}
            , filename = __dirname + '/testConfigFile.json';
        try {
            fs.writeFileSync(filename, JSON.stringify(jsonObj), {encoding: 'utf8'});

            var conf = new Conf('jsonTestConfig', ['keyA', 'keyB']);

            function onConfigLoaded(args) {
                expect(args).to.be.ok;
                expect(args.source).to.be.equal(filename);
                expect(args.config).to.be.deep.equal(jsonObj);
            }
            var spyLoaded = chai.spy(onConfigLoaded);
            conf.on('onConfigLoaded', spyLoaded);

            conf.load(filename);
            expect(spyLoaded).to.have.been.called.once;

            function onConfigSaved(args) {
                expect(args).to.be.ok;
                expect(args.target).to.be.deep.equal(jsonObj);
            }
            var spySaved = chai.spy(onConfigSaved);
            conf.on('onConfigSaved', spySaved);

            conf.save({});
            expect(spySaved).to.have.been.called.once;
        } catch (err) {
            expect(err).to.be.not.ok;
        } finally {
            fs.unlinkSync(filename);
        }
    });

    it('should adds new keys to the configuration', function() {
        var keys = ['keyA', 'keyB', 'keyC', 'keyD', 'keyE', 'keyF'];
        var conf = new Conf('addKeysConfig', keys.slice(0, 1)).addKeys(keys[1]); // keyA/B
        expect(conf.keys).to.be.deep.equal(keys.slice(0, 2));
        conf.addKeys(keys.slice(2, 4)); // keyC/D
        expect(conf.keys).to.be.deep.equal(keys.slice(0, 4));
        conf.addKeys(keys[4], keys.slice(5)); // keyE/F
        expect(conf.keys).to.be.deep.equal(keys);
    });

    it('should removes unused keys from the configuration', function() {
        var keys = ['keyA', 'keyB', 'keyC', 'keyD', 'keyE', 'keyF'];
        var conf = new Conf('removeKeysConfig', keys).removeKeys(keys[5]);
        expect(conf.keys).to.be.deep.equal(keys.slice(0, 5));
        conf.removeKeys(keys.slice(3));
        expect(conf.keys).to.be.deep.equal(keys.slice(0, 3));
        conf.removeKeys(keys.slice(1), keys[0]);
        expect(conf.keys).to.be.deep.equal([]);
    });
});
