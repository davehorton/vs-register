'use strict';

const mongoose = require('mongoose') ;
const Customer = require('vs-models')(mongoose,'Customer') ;
const ProxyServer = require('vs-models')(mongoose,'Proxy') ;
const Device = require('vs-models')(mongoose,'Device') ;
const Rdr = require('vs-models')(mongoose,'Rdr') ;
const async = require('async') ;
const debug = require('debug')() ;

async.waterfall([clearRdrs, createCustomer, createProxy, createDevice], 
  function(err, devices) {
    if( err ) {
      debug('Error seeding database: ', err) ;
      return ;
    }
    debug('successfully seeded database with device: ', devices) ;
  }) ;

function clearRdrs(callback) {
  Rdr.find({}).remove( function() {
    callback(null) ;
  }) ;
}
function createCustomer(callback) {
  Customer.find({}).remove( function() {
    Customer.create([{
      name: 'phone.com'
    }], function(err, customers) {
      if( err ) { return callback(err); }
      callback(null, customers[0]._id) ;
    }) ;
  }) ;
}

function createProxy(customer, callback) {
  ProxyServer.find({}).remove( function() {
    ProxyServer.create([{
      customer: customer,
      name: 'acme.com'
    }], function(err, proxies) {
      if( err ) { return callback(err); }
      callback(null, proxies[0]._id) ;
    }) ;
  }) ;
}
function createDevice(proxy, callback) {
  Device.find({}).remove( function() {
    Device.create([{
      proxy: proxy,
      username: 'xxxxx',
      password: 'yyyyy',
      status: 'ready'
    }], function(err, devices) {
      if( err ) { return callback(err); }
      callback(null, devices) ;
    }) ;
  }) ;
}


