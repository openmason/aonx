var aonx = require('../index');

// lets define some config to override
var config = {};
config.app = {};
config.app.title = 'My API Server';
config.app.version = '0.0.1';
config.app.key = 'apisrvr';
config.app.secret = 'topsecret';
// enable jsonp
config.server =  {};
config.server.jsonp = true;

aonx.init(config);

// start the server
aonx.run(8080);
