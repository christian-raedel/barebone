var expect = require('chai').expect
    , FsActions = require('../../modules/fs-actions');

describe('FsActions', function() {
    var fs = null;

    it('should creates a new instance', function() {
        fs = new FsActions({debug: true});
        expect(fs).to.be.an.instanceof(FsActions);
        expect(fs.config().get('fsDelimiter')).to.be.equal('/');
        expect(fs.config().get('debug')).to.be.equal(true);
    });

    it('should creates a new directory', function(done) {
        var dir = __dirname + '/tests';
        fs.mkdir(dir)
        .then(function(created) {
            expect(created).to.be.true;
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });

    it('should creates a new directory with sub-directories', function(done) {
        var dir = __dirname + '/tests/sub1/sub2/sub3';
        fs.mkdir(dir)
        .then(function(created) {
            expect(created).to.be.true;
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });
});
