/* global describe, it, afterEach, beforeEach, xdescribe, xit */

/*
 * LevelSync
 * https://github.com/toddself/levelsync
 *
 * Copyright (c) 2013 Todd Kennedy. All rights reserved.
 */
'use strict';

var dbPath = __dirname + '/../test_db';
var levelup = require('level');
var db = levelup(dbPath, {valueEncoding: 'json'});
var Backbone = require('backbone');
Backbone.Promises = require('backbone-promises');
Backbone.sync = require('../')(db);
var expect = require('chai').expect;
var fixture = require('../fixture');


describe('levelsync', function(){
  var existingid;
  var existing_model;

  beforeEach(function(done){
    existing_model = new Backbone.Promises.Model();
    existing_model.set(fixture);
    existing_model.save(existing_model.toJSON())
    .then(function(model){
      existing_model.set(model.toJSON());
      existingid = model.id;
      done();
    })
    .catch(done);
  });

  it('Should save the object to the modelbase', function(done){
    var test_model = new Backbone.Promises.Model();
    test_model.set(fixture);

    test_model.save()
    .then(function(model){
      if (model.id){
        done();
      } else {
        done(new Error('Not saved'));
      }
    })
    .catch(done);
  });

  it('Should perform an in-place update when changing object', function(done){
    var new_title = 'this is a test';
    existing_model.set('title', new_title);

    existing_model.save()
    .then(function(model){
      expect(model.toJSON()).to.have.property('id', existingid);
      expect(model.toJSON()).to.have.property('title', new_title);
      done();
    })
    .catch(done);
  });

  it('Should delete an object in the database', function(done){
    existing_model.destroy()
    .then(function(model){
      done();
    })
    .catch(done);
  });

  it('Should get an existing object in the database', function(done){
    var m = new Backbone.Promises.Model();
    m.set('id', existingid);
    m.fetch({success: f});
    function f(model){
      expect(model.toJSON()).to.have.property('id', existingid);
      done();
    };
  });

  it('Should get all existing objects in the database', function(done){
    var c = new Backbone.Promises.Collection();
    c.fetch({success: f});
    function f(collection){
      expect(collection).to.have.length(1);
      var model = collection.at(0);
      console.log(collection, model);
      expect(model.toJSON()).to.have.property('id', existingid);
      done();
    };

  });

  afterEach(function(done){
    db.createKeyStream()
      .on('data', function(k){
        db.del(k);
      })
      .on('close', function(){
        done();
      });
  });
});
