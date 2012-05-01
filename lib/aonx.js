/**
 * aonx - copyright(c) 2011 truepattern.
 */

// todo's 


// dependencies
var winston  = require('winston');
var express  = require('express');
var _        = require('underscore');
var config   = require('./config');

// set up module variables
var pkgname  = '[aonx] ';
//winston.default.transports.console.level = 'info';
winston.default.transports.console.colorize = true;
winston.default.transports.console.timestamp = true;

// exported methods, variables

var app = express.createServer();

// configure the express server
exports.init = function(appconfig) {
  winston.info(pkgname + 'initializing...');
  // if config is passed, over-ride the defaults with it
  config=_.extend(config, appconfig);
  winston.debug(pkgname + '  applying config:',JSON.stringify(config));
  app.configure(function() {
      // call favicon first
      app.use(express.favicon());
      app.use(express.logger('dev'));
      
      if(config.server.jsonp) {
        app.set('jsonp callback', config.server.jsonp);
        winston.debug(pkgname + '  jsonp:',config.server.jsonp);
      }
      
      app.use(express.bodyParser());
      app.use(express.methodOverride());  
      
      app.use(express.cookieParser());
    });
  
  app.configure('development', function() {
      app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });
  
  app.configure('production', function() {
      app.use(express.errorHandler()); 
    });

};

// start the server
exports.run = function(port) {
  if(!port) {
    port=config.server.port;
  }
  winston.info(pkgname + 'run server on port:', port);
  app.listen(Number(port));
  console.log("'%s' listening on port '%d' in '%s' mode", 
              config.app.title,
              app.address().port, 
              app.settings.env);
};

// -----------------------------------------------
// internal functions


// create an error with .status. we
// can then use the property in our
// custom error handler (Connect respects this prop as well)
function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

// register these error handlers in the 
// express configuration
function errorHandlers() {
  // middleware with an arity of 4 are considered
  // error handling middleware. When you next(err)
  // it will be passed through the defined middleware
  // in order, but ONLY those with an arity of 4, ignoring
  // regular middleware.
  app.use(function(err, req, res, next){
      winston.error(err);
      if(req.accepts('html')) {
        res.status(err.status || 500);
        res.render('500', { error: err });
        return;
      }
      res.send(err.status || 500, { error: err.message });
    });

  // our custom JSON 404 middleware. Since it's placed last
  // it will be the last middleware called, if all others
  // invoke next() and do not respond.
  app.use(function(req, res) {
      winston.error('Failed to locate:'+req.url);
      if(req.accepts('html')) {
        res.status(404);
        res.render('404', { url: req.url });
        return;
      }
      res.send(404, { error: "can't find the resource" });
    });
}
