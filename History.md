# release 0.5.2
 * upgrade to nodejs 0.8.x, express 3, mongoose 2.x

# release 0.4.8
 * added support for clustering
 * added trace on console for errors
 * removed cluster2 as express version have issues
 * moved to latest express with variable connection.encrypted set to secure
 * added authentication support for api path
 * added ignores for authentication list

# release 0.3.3
 * added support for authentication (mongoose-auth) plugins based off of mongoose
 * added https support, two additional params config.server.scheme = 'https' and config.server.key and config.server.cert (filenames) 

# release 0.2.1
 * added ObjectId support to crudHelpers
 * separated mongoose.js to mongoose-plugins

# release 0.1.6
 * added query support to index call
 * removed X-Powered-By
 * added '/' index route to return 200
 * jsonp params are filtered out
 * error codes & create method added

# release 0.1.1
 * added compression to static dir (/public)
# release 0.1.0
 * added mongoose helpers (crudHelpers)
# release 0.0.7
 * persistent session support added
 * additional configuration updates including static serving path
# release 0.0.3
 * additional examples added
# release 0.0.1
 * initial repository creation
