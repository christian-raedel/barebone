var expect = require('chai').expect
    , modules = require('../modules');

describe('DataStore', function() {
    var ds = null;

    before(function() {
        ds = modules.DataStore({dataDir: __dirname + '/testdata'});
    });

    it('should load testdata', function() {
        var testdata = require('./testdata/testcollection.json');
        ds.load();
        expect(ds.collections.testcollection).to.be.ok;

        var testrecord = ds.collections.testcollection().first();
        expect(testrecord['___id']).to.be.ok;
        expect(testrecord.name).to.be.equal(testdata[0].name);
        expect(testrecord.description).to.be.equal(testdata[0].description);
    });

    it('should save testdata', function(done) {
        ds.collections.testcollection.insert({name: "testrecord3", description: "the last test record..."});
        ds.save()
        .then(function(saved) {
            expect(saved).to.be.true;
            done();
        }, done);
    });
});
