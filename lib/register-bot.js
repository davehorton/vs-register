'use strict' ;

const mongoose = require('mongoose') ;
const Rdr = require('vs-models')(mongoose,'Rdr') ;
const calculateRtt = require('./utils').calculateRtt ;
const parseExpires = require('./utils').parseExpires ;
var app = require('../app') ;
var logger = app.logger ;
var assert = require('assert') ;

class RegisterBot {
  constructor( device ) {
    this.started = false ;
    this.registered = false ;
    this.device = device ;
    this.expires = 3600 ;
    this.uri = 'sip:' + device.username + '@' + this.device.proxy.name ;
    this.contact = '<' + this.uri + '>;expires=3600' ;
    this.txnDetails = {} ;
  }

  start() {
    assert(!this.started, 'RegisterBot#start called but bot is already started') ;
    this.started = true ;
    this.doRegister() ;
  }
  stop () {
    assert(this.started, 'RegisterBot#stop called but bot is not started') ;
    this.started = false ;
    if( this.timerId ) { clearTimeout( this.timerId) ; }
  }

  doRegister() {
    var self = this ;
    app.request({
        uri: this.uri,
        method: 'REGISTER',
        headers: {
            to: this.uri,
            from: this.uri,
            contact: this.contact
        },
        auth: function( req, res, callback ) {
          // we've been challenged
          // 
          // save some details
          self.txnDetails.challenge = {} ;
          self.txnDetails.challenge.status = res.status ;
          self.txnDetails.challenge.ms = calculateRtt( req.stackTime, res.stackTime ) ;
          self.txnDetails.challenge.requestTime = req.stackTime ;
          self.txnDetails.challenge.responseTime = res.stackTime ;
          self.txnDetails.challenge.sbcAddress = res.source_address ;
          self.txnDetails.challenge.sbcPort = res.source_port ;

          // respond with username and password
          callback(null, self.device.username, self.device.password) ;
        }
    }, function( err, req ) {
      if( err ) {
        logger.error('RegisterBot#doRegister: Error attempting to register %s@%s: ', self.device.username, self.device.password, err) ;
        return false ;
      }
      var finalRequest = req ;
      req.on('authenticate', function(req) {
        finalRequest = req ;
      }) ;
      req.on('response', function(res) {
        if( 100 === res.status) { return ; }

        self.txnDetails.sbcAddress = res.source_address ;
        self.txnDetails.sbcPort = res.source_port ;
        self.txnDetails.status = res.status ;
        self.txnDetails.requestTime = finalRequest.stackTime ;
        self.txnDetails.responseTime = res.stackTime ;        
        self.txnDetails.ms = calculateRtt( finalRequest.stackTime, res.stackTime ) ;
        if( 200 === res.status ) {
          self.registered = true ;
          self.txnDetails.expires = parseExpires(res) ;
        }
        
        logger.info('transaction details: ', JSON.stringify(self.txnDetails)) ;

        if( self.txnDetails.challenge ) {
          // write a record for the challenged REGISTER (if we were, in fact, challenged)
          Rdr.create({
            device: self.device.id,
            stackTime: self.txnDetails.challenge.requestTime,
            status: self.txnDetails.challenge.status,
            rtt: self.txnDetails.challenge.ms,
            sbcAddress: self.txnDetails.sbcAddress,
            sbcPort: self.txnDetails.sbcPort,
            hasAuth: false
          }) ;          
        }
        Rdr.create({
          // write a record for the final register
          device: self.device.id,
          stackTime: self.txnDetails.requestTime,
          status: res.status,
          rtt: self.txnDetails.ms,
          sbcAddress: self.txnDetails.sbcAddress,
          sbcPort: self.txnDetails.sbcPort,
          hasAuth: ('challenge' in self.txnDetails)
        }) ;

        if( self.started ) {
          let nextExpires = 200 === res.status ? self.txnDetails.expires * 1000 : 60000;
          self.timerId = setTimeout( self.doRegister.bind(self), nextExpires) ;          
        }        
      }) ;
    }) ;
  }
}

exports = module.exports = RegisterBot ;
