/**
 * aonx - copyright(c) 2011 truepattern.
 */

//
// CRUD helpers for mongoosejs.
//

/** Todo's 
- handle all error conditions
*/

// dependencies
var logger  = require('winston');
var _       = require('underscore');

// set up module variables
var pkgname  = '[aonx-mongoose] ';

// exported methods, variables
exports.crudHelpers = function(schema, options) {

  // json output to carry id instead of _id
  schema.method.toJSON = function (obj) {
    var o=obj.toObject(); 
    o.id=o._id; 
    delete o._id; 
    return o;
  };

  schema.statics.index = function(req,res) {
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + ' index called with req:'+JSON.stringify(req.query));
    // lets update the query based on params passed
    var query={};
    _.extend(query,req.query);
    this.find(query, function(err, objs) {
        if(!err) {
          res.send(_.map(objs, function(o) { return schema.method.toJSON(o); }));
        }
      });
  };

  schema.statics.updateObject = function(record, req, res) {
    this.createOrUpdate(req, record, function(err, newObj) {
        if(!err) {
          res.send(schema.method.toJSON(newObj));
        }
      });
  };

  schema.statics.showObject = function(record, req, res) {
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + ' GET called with req:'+JSON.stringify(req.query));
    if(typeof record == 'undefined') {
      logger.error(pkgname + 'invalid record passed :'+JSON.stringify(params));
    } else {
      res.send(schema.method.toJSON(record));
    }
  };

  schema.statics.removeObject = function(record, req, res) {
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + ' DELETE called with req:'+JSON.stringify(req.query));
    if(typeof record == 'undefined') {
      logger.error(pkgname + 'invalid record passed :'+JSON.stringify(params));
    } else {
      logger.info(pkgname + '** removing:'+JSON.stringify(record));
      record.remove(function(err) { 
          if(err) {
            // @todo: need to send appropriate error code
            logger.error(pkgname+'Error occured while removing :'+err);
            res.send(500);
          } else {
            res.send(200);
          }
        });
    }
  };

  schema.statics.findObject = function(id, cb) {
    var self = this;
    process.nextTick(function(){
        logger.debug(pkgname + 'find :'+id);
        self.findById(id, function(err, obj) {
            logger.debug(pkgname + '  -- found :'+JSON.stringify(obj));
            cb(err, obj);
          });
      });
  };
  
  schema.statics.createOrUpdate = function(req, record, cb) {
    var body = req.body;
    /*
     * There are cases, where the whole object might
     * be passed within the modelName.
     */
    var modelName = this.modelName.toLowerCase();
    if(body && body[modelName]) {
      body = body[modelName];
    }
    var query = req.query; 
    if(query && query[modelName]) {
      query = query[modelName];
    }
    // params passed in body overrides any query params
    var params = _.extend(query, body);
    logger.debug(pkgname + modelName + ' update with :'+JSON.stringify(params));
    
    if(typeof record == 'undefined') {
      logger.error(pkgname + 'invalid record passed :'+JSON.stringify(params));
      cb('invalid record', record);
    }

    for(var p in params) {
      if(p && params[p]) {
        logger.debug(pkgname + '  - updating ' + p + ' to ' + params[p]);
        record[p] = params[p];
      }
    }
    logger.info(pkgname + '** updating:'+JSON.stringify(record));
    record.save(function(err) { 
        if(err) {
          // send error
          logger.error(pkgname+'Error occured while saving :'+err);
        }
        cb(err, record);
      });
  } 
};

