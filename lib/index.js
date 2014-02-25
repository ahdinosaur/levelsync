/*
 * LevelSync
 * https://github.com/toddself/levelsync
 *
 * Copyright (c) 2013 Todd Kennedy. All rights reserved.
 */
'use strict';

var Backbone = require('backbone');
var highland = require('highland');

/**
 * Returns a `Backbone.Sync` method
 * with our new version
 * @param  {String} db  LevelDB instance.
 * @return {Function}     `Backbone.Sync` method
 */
module.exports = function(db){
  /**
   * `Backbone.Sync` method which uses LevelDB for persistance
   * @private
   * @async
   * @param  {String} method  What are we doing with the data
   * @param  {Object} obj   The data
   * @param  {Object} options Options hash
   * @return {Object}          A deferred promise
   */
  var levelSync = function levelSync(method, obj, options){

    // setup helper callback function that uses
    // standard node.js (err, data) format
    // and defaults data to obj
    var cb = function(err, data) {
      if (err) { return options.error(err); }
      data = data || obj;
      return options.success(data);
    };


    if (obj instanceof Backbone.Collection) {
      switch (method) {
        case 'read':
          highland(db.createReadStream())
            .pluck('value')
            .errors(function (err) {
              if (err) { return cb(err); }
            })
            .map(function (item) {
              return new obj.model(item);
            })
            .toArray(function (models) {
              return cb(null, models);
            });
          break;
        default:
          cb(new Error('Collection method '+method+'not recognized'));
          break;
      }
    }
    else if (obj instanceof Backbone.Model) {

      switch (method) {
        case 'create':
        case 'update':
        case 'patch':
          if(method === 'create') obj.set('id', obj.cid);
          db.put(obj.get('id'), obj.toJSON(), cb);
          break;
        case 'delete':
          db.del(obj.get('id'), cb);
          break;
        case 'read':
          if(typeof obj.get('id') === 'undefined'){
            cb(new Error('No ID attribute set on model'));
          } else {
            db.get(obj.get('id'), cb);
          }
          break;
        default:
          cb(new Error('Model method '+method+' not recognized'));
          break;
      }
    }
    else {
      cb(new Error('Invalid Backbone Model or Collection'));
    }

  };
  return levelSync;
};
