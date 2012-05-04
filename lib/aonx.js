/**
 * aonx - copyright(c) 2011 truepattern.
 */

/** Todo's 
- handle error condition on db init
- handle maxage for static server
- handle assets
*/

// dependencies
var winston  = require('winston');
var express  = require('express');
var resource = require('express-resource');
var _        = require('underscore');
var config   = require('./config');
var Session  = require('connect-mongodb');

// set up module variables
var pkgname  = '[aonx] ';
//winston.default.transports.console.level = 'info';
winston.default.transports.console.colorize = true;
winston.default.transports.console.timestamp = true;

// exported methods, variables
var app = express.createServer();
global.app = app;

// configure the express server
exports.init = function(appconfig, preHandler) {
  winston.info(pkgname + 'initializing...');
  // if config is passed, over-ride the defaults with it
  config=_.extend(config, appconfig);
  global.config=config;
  winston.debug(pkgname + '  applying config:',JSON.stringify(config));
  app.configure(function() {
      // call favicon first
      app.use(express.favicon());
      app.use(express.logger('dev'));

      // add the server side view engine
      if(config.server.views) {
        app.set('views', config.server.views);
        app.set('view engine', 'jade');
        app.dynamicHelpers( {messages: require('express-messages') });
        // add _ as helper within template
        app.helpers( { _ : require('underscore') });
        winston.debug(pkgname + '  set jade as view engine...path::',config.server.views);
      }
      
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

  // lets setup the pre/post handlers
  app.configure(function() {
      // call aonx prehandler first
      _preHandlers();
      
      // call application pre-handler
      if(preHandler) {
        preHandler();
      }

      app.use(app.router);
      
      // any static files go to 'public'
      if(config.server.path) {
        app.use(express.static(config.server.path + '/public'));
        winston.debug(pkgname + '  static files served from:',config.server.path+'/public');
      }
      
      // register any post-handlers
      _postHandlers();
      
      // register the error handlers next to router
      _errorHandlers();
    });

};

// start the server
exports.run = function(port) {
  if(!port) {
    port=config.server.port;
  }
  winston.info(pkgname + 'starting server on port:', port);
  app.listen(Number(port));
  console.log("'%s' listening on port '%d' in '%s' mode", 
              config.app.title,
              app.address().port, 
              app.settings.env);
};

// -----------------------------------------------
// internal functions


// register all pre handlers here
function _preHandlers() {
  var session;
  // enable db connection
  if(config.db.enabled) {
    var db = require('./db');
    db.init(config.db);
    winston.debug(pkgname + "  mongodb initialized at:",config.db.url);

    // enable db sessions
    var oneWeek = 657450000;
    session = express.session({
        key    : config.app.key,
        store  : new Session({url: config.db.url }), 
        cookie : { maxAge: config.app.cookieAge||oneWeek }, 
        secret : config.app.secret
      });
    winston.debug(pkgname + "  persistent sessions enabled");
  } else {
    session = express.session({
        key    : config.app.key,
        secret : config.app.secret
      });
    winston.debug(pkgname + "  sessions enabled");
  }
  app.use(session);

}

// all post handlers go here
function _postHandlers() {
  // install api checks
  if(config.api.keycheck) {
    winston.debug(pkgname + "  keycheck to API's enabled");
    // here we validate the API key 
    app.all(config.api.path, function(req, res, next){
        var key = req.query[config.api.KEYNAME] || req.body[config.api.KEYNAME];
        
        // key isnt present
        if (!key) return next(error(400, 'api key required'));
        
        // key is invalid
        if (!~config.api.keys.indexOf(key)) return next(error(401, 'invalid api key'));
        
        // all good, store req.key for route access
        req.key = key;
        next();
      });
  }

  // jsonp support for delete, put & post (partial post)
  if(config.server.jsonp) {
    winston.debug(pkgname + "  jsonp support on api's enabled");
    // check if callback is there along with method
    app.all(config.api.path, function(req, res, next) {
        if(req.query && req.query['callback'] && req.query['_method']) {
          // lets rewrite the method, especially PUT/DELETE/POST
          req.method=req.query['_method'];
          winston.debug(pkgname + "jsonp request converted", req.query);
        }
        next();
      });
  }

  var api = {
    index: function(req,res) {
      res.json({app:config.app.title, version:config.app.version});
    }
  };
  exports.apiresource = app.resource('api', api);
  winston.debug(pkgname + "  api handler added");
}


// --- Error handlers

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
function _errorHandlers() {
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
