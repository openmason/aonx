/**
 * aonx - copyright(c) 2012 truepattern.
 * MIT Licensed
 */

/** Todo's 
 * 
 */

// dependencies
var winston  = require('winston');
var _        = require('underscore');
var Cluster  = require('cluster2');

// set up module variables

// Todo
// - handle server close, close connection
// - add monPort (monitoring port)
// - add ecv


// config for cluster
//
// - server.port - where cluster would listen to
//
// 
//

var _mycluster;

/**
 * Initialize the cluster configurations
 */
exports.init = function(config) {
  var c = new Cluster({
    port: config.server.port,
    cluster: config.cluster.enabled || false,
    noWorkers: config.cluster.workers || undefined,
    ecv: {
      path: '/ecv', // Send GET to this for a heartbeat
      control: true, // send POST to /ecv/disable to disable the heartbeat, and to /ecv/enable to enable again
      monitor: '/',
      validator: function() {
        return true;
      }
    }
  });
  var processName = '['+(config.app.title || 'aonx')+'] ';
  c.on('died', function(pid) {
    winston.error(processName+'Worker ' + pid + ' died');
  });
  c.on('forked', function(pid) {
    winston.error(processName+'Worker ' + pid + ' forked');
  });
  c.on('SIGTERM', function(event) {
    winston.error(processName+'Got SIGTERM ' + JSON.stringify(event) + ' ... shutting down!');
  });
  _mycluster=c;
};


/**
 * Run the cluster
 */
exports.run = function(expressApp) {
  var c = _mycluster || new Cluster();
  c.listen(function(cb) {
    cb(expressApp);
  });
};
