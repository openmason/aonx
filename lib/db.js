/**
 * aonx - copyright(c) 2012 truepattern.
 * MIT Licensed
 */
var mongoose      = require('mongoose');

// config to carry the following attributes
//
// - url      mongodb url
//
// @todo
// - replica set configuration
// 
exports.init = function(config) {
  mongoose.connect(config.url);
};
