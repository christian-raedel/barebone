var chai = require('chai')
    , spies = require('chai-spies');

chai.use(spies);

var expect = chai.expect
    , _ = require('lodash')
    , q = require('q')
    , fs = require('fs')
    , FsActions = require('../../modules/fs-actions');

describe('FsActions', function() {
    var fsActions = null;

    it('should creates a new instance', function() {
        fsActions = new FsActions({debug: true});
        expect(fsActions).to.be.an.instanceof(FsActions);
        expect(fsActions.config().get('fsDelimiter')).to.be.equal('/');
        expect(fsActions.config().get('debug')).to.be.equal(true);
        fsActions.config().set('debug', true);
        expect(q.longStackSupport).to.be.true;
    });

    it('should creates a new directory', function() {
        var dir = __dirname + '/tests/1/2/3';
        fsActions.createDirSync(dir);
        expect(fs.existsSync(dir)).to.be.true;
    });

    it('should creates multiple new directories', function() {
        var dirs = [
            __dirname + '/tests/2/3/4',
            __dirname + '/tests/2/4/5'
        ];
        fsActions.createDirSync(dirs);
        _.forEach(function(dir) {
            expect(fs.existsSync(dir)).to.be.true;
        });
    });

    it('should creates a new directory async', function(done) {
        var dir = __dirname + '/tests/3/4/5';
        fsActions.createDir(dir)
        .then(function(created) {
            expect(created).to.be.true;
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });

    it('should creates a new directory with sub-directories', function(done) {
        var dirs = [
            __dirname + '/tests/4/5/6',
            __dirname + '/tests/4/6/7'
        ];
        fsActions.createDir(dirs)
        .then(function(created) {
            expect(created).to.be.true;
            done();
        })
        .catch(function(reason) {
            done(new Error(reason));
        });
    });
});
