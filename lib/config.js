/**
 * aonx - default configuration
 */
var config = {};

// application data
config.app = {};
config.app.title = 'aonx service';
config.app.version = '0.0.1';
config.app.key = 'aonx';
config.app.secret = 'XoB_kCoL';
  
// api related configs
config.api = {};
config.api.keycheck = false;

// server related settings
config.server =  {};
config.server.port = process.env.PORT || 8074;
config.server.modules = [];
config.server.jsonp = false;

// auth related settings
config.authentication = {};
config.authentication.enabled= false;
  
// db related settings
config.db = {};

// export the config
module.exports = config;
