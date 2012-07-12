/**
 * aonx - copyright(c) 2011 truepattern.
 * MIT Licensed
 */

/** Todo's 
 * 
 * handle error condition on db init
 * handle assets
 * add exit handler to disconnect any connections and free resources
 * can run both http and https server at the same time?
 * set express.js flag to handle https
 * 
 */

// dependencies
var winston  = require('winston');
var express  = require('express');
var resource = require('express-resource');
var _        = require('underscore');
var Session  = require('connect-mongodb');
var gzippo   = require('gzippo');
var fs       = require('fs');
var config   = require('./config');
var cluster  = require('./cluster');

// set up module variables
var pkgname  = '[aonx] ';
//winston.default.transports.console.level = 'info';
winston.default.transports.console.colorize = true;
winston.default.transports.console.timestamp = true;

// exported methods, variables
global.app;

// configure the express server
exports.init = function(appconfig, preHandler) {
  winston.info(pkgname + 'initializing...');
  // if config is passed, over-ride the defaults with it
  config=_.extend(config, appconfig);
  if(config.server.scheme==='https' && config.server.key && config.server.cert) {
    var privateKey = fs.readFileSync(config.server.path+'/'+config.server.key).toString();
    var certificate = fs.readFileSync(config.server.path+'/'+config.server.cert).toString();
    global.app = express.createServer({key:privateKey, cert:certificate});
  } else {
    global.app = express.createServer();
  }
  global.config=config;
  winston.debug(pkgname + '  applying config:',JSON.stringify(config,null,2));
  app.configure(function() {
    // call favicon first
    app.use(express.favicon());
    app.use(express.logger('dev'));
    
    // remove the powered by header - lets not give clue to hackers :-)
    app.use(function (req, res, next) {
      res.removeHeader("X-Powered-By");
      next();
    }); 

    // there is a bug in express.js
    // that if https is set, all the redirects
    // would not go to https, fixing
    // the variable req.secure to force 'https'
    app.settings['trust proxy']=config.server.proxy || true;
    if(config.server.scheme==='https') {
      app.use(function(req,res,next) {
        req.secure=true;
        next();
      });
      /*
      app.use(function(req, res, next) {
        var schema = req.headers["x-forwarded-proto"];
        // --- Do nothing if schema is already https
        if (schema === "https")
          return next();
        // --- Redirect to https
        res.redirect("https://" + req.headers.host + req.url);
      });
      */
    }

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
        //app.use(express.static(config.server.path + '/public'));
        app.use(gzippo.staticGzip(config.server.path + '/public'));
        winston.debug(pkgname + '  static files served (compressed) from:',config.server.path+'/public');
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
    port=config.server.port || 8080;
  }
  winston.info(pkgname + 'starting "'+ config.app.title + 
               '" server, "' + app.settings.env + 
               '" mode on port:', port);
  if(config.cluster.enabled) {
    cluster.init(config);
    cluster.run(app);
  } else {
    app.listen(Number(port));
  }
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

    // export crudHelper
    exports.crudHelpers = require('mongoose-plugins').crudHelpers;
    exports.installUserSchema = require('mongoose-plugins').installUserSchema;

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
  global.apiresource = app.resource('api', api);
  winston.debug(pkgname + "  api handler added");
  winston.debug(pkgname + "init complete");
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
    console.trace();
    if(req.accepts('html') || req.is('html')) {
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
    console.trace();
    if(req.accepts('html') || req.is('html')) {
      res.status(404);
      res.render('404', { url: req.url });
      return;
    }
    res.send(404, { error: "can't find the resource" });
  });
}
