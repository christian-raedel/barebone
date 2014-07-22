var _ = require('lodash');

module.exports = _.extend(module.exports, require('./logger'));

module.exports = _.extend(module.exports, require('./hooks'));
