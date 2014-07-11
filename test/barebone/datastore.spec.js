var _ = require('lodash')
    , expect = require('chai').expect
    , fs = require('fs')
    , modules = require('../../modules/barebone');

describe('DataStore', function() {
    var datastore = null
        , testdata = null
        , datadir = __dirname + '/testdata';

    function rmdir(dir) {
        if (fs.existsSync(dir)) {
            _.forEach(fs.readdirSync(dir), function(item) {
                item = dir + '/' + item
                var stats = fs.statSync(item);
                if (stats.isFile()) {
                    fs.unlinkSync(item);
                }

                if (stats.isDirectory()) {
                    rmdir(item);
                }
            });

            return fs.rmdirSync(dir);
        }

        return false;
    }

    before(function() {
        rmdir(datadir);
        fs.mkdirSync(datadir);
        testdata = {
            name: 'testrecordA',
            description: 'one testrecord...'
        };
        fs.writeFileSync(datadir + '/testcollection.json', JSON.stringify(testdata));
    });

    after(function() {
        rmdir(datadir);
    });

    it('should load testdata', function() {
        datastore = modules.DataStore({
            datadir: datadir,
            autoLoad: false
        }).loadData();
        expect(datastore.collections.testcollection).to.be.ok;

        var testrecord = datastore.collections.testcollection().first();
        expect(testrecord['___id']).to.be.ok;
        expect(testrecord.name).to.be.equal(testdata.name);
        expect(testrecord.description).to.be.equal(testdata.description);
    });

    it('should save testdata', function(done) {
        datastore.collections.testcollection.insert({
            name: 'testrecordB',
            description: 'one more test record...'
        });
        datastore.saveData()
        .then(function(saved) {
            expect(saved).to.be.true;
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });
});
