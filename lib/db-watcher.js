'use strict' ;

const logger = require('../app').logger ;
const mongoose = require('mongoose') ;
const Device = require('vs-models')(mongoose,'Device') ;
const RegisterBot = require('./register-bot') ;

class DbWatcher {
  constructor( delay ) {
    this.timerId = null ;
    this.delay = delay || 15000 ;
    this.bots = {} ;
  }

  start() {
    this.timerId = setInterval( this.checkDb.bind(this), this.delay ) ;
  }

  stop() {
    var self = this ;
    if( this.timerId ) {
      clearInterval( self.timerId ) ;
      self.timerId = null ;
    }
  }

  checkDb() {
    var self = this ;

    Device.find({status: 'ready'})
    .populate('proxy')
    .exec(function(err, devices) {
      if( err ) { return logger.error('Error retrieving devices: ', err) ; }
      if( 0 === devices.length ) { 
        //logger.debug('no devices found') ; 
      }
      else {
        devices.forEach( device => {
          logger.info('starting device %s: %s @ %s ', device.id, device.username, device.proxy.name) ;

          var bot = new RegisterBot(device) ;
          bot.start() ;
          self.bots[device.id] = bot ;
          device.status = 'running' ;
          device.save() ;
        }) ;
      }
    }) ;
  }
}

module.exports = DbWatcher ;

