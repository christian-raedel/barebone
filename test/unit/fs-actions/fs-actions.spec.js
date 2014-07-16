var chai = require('chai')
    , spies = require('chai-spies');

chai.use(spies);

var expect = chai.expect
    , _ = require('lodash')
    , fs = require('fs')
    , FsActions = require('../../../modules/fs-actions');

describe('FsActions', function() {
    var fsActions = null;

    it('should creates a new instance', function() {
        fsActions = new FsActions();
        expect(fsActions).to.be.an.instanceof(FsActions);
        expect(fsActions.config().get('fsDelimiter')).to.be.equal('/');
        expect(fsActions.config().get('debug')).to.be.equal(false);
    });

    it('should creates a new directory', function() {
        var dir = __dirname + '/tests/1/2/3';
        fsActions.createDir(dir);
        expect(fs.existsSync(dir)).to.be.true;
    });

    it('should creates multiple new directories', function() {
        var dirs = [
            __dirname + '/tests/2/3/4',
            __dirname + '/tests/2/4/5'
        ];
        fsActions.createDir(dirs);
        _.forEach(function(dir) {
            expect(fs.existsSync(dir)).to.be.true;
        });
    });

    it('should reads and executes a directory', function() {
        var dir = __dirname + '/tests'
            , s = 'helloWorld!';

        fs.writeFileSync(dir + '/testmodule.txt', s, {encoding: 'utf8'});
        fsActions.readDirAndExecuteSync(dir, function(filename, args) {
            expect(fs.readFileSync(filename, {encoding: 'utf8'})).to.be.equal(s);
            expect(args).to.be.equal(args);
        }, s);
    });

    it('should removes a directory', function() {
        var dir = __dirname + '/tests';

        fsActions.removeDir(dir);
        expect(fs.existsSync(dir)).to.be.false;
    });
});
