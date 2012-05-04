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

// cookie age would work only if db is
// enabled and set
config.app.cookieAge = 657450000;  // one week
  
// api related configs
config.api = {};
config.api.path = '/api/*';
config.api.keycheck = false;

// server related settings
config.server =  {};
config.server.port = process.env.PORT || 8074;
config.server.modules = [];
// jsonp:
// - if enabled would accept a 'callback' and optional '_method'
// - _method could be PUT/DELETE/POST, so on GET with this
//   param would set the operation internally to the passed method
config.server.jsonp = false;

// auth related settings
config.authentication = {};
config.authentication.enabled = false;
  
// db related settings
config.db = {};
config.db.enabled = false;
config.db.url = 'mongodb://localhost:27017/aonx';

// export the config
module.exports = config;
