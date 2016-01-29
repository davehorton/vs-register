'use strict' ;

const _ = require('lodash') ;

var obj = module.exports = {} ;

obj.calculateRtt = function( sendTime, recvTime ) {

  var s = _.map( sendTime.split(':'), function( item ) { return Number(item); } ) ;
  var r = _.map( recvTime.split(':'), function( item ) { return Number(item); } ) ;
  
  var ms = 0 ;

  // handle send and receive on different sides of midnight
  if( r[0] < s[0] ) { r[0] += 24; }

  ms += (r[0] - s[0]) * 60 * 60 * 1000 ;
  ms += (r[1] - s[1]) * 60 * 1000 ;
  ms += (r[2] - s[2]) * 1000 ;

  return Math.floor( ms ) ;
} ;

obj.parseExpires = function( res ) {
  var contact = res.getParsedHeader('contact') ;
  var expires ; 
  if( contact && contact.length > 0 && contact[0].params && contact[0].params.expires ) {
    expires = parseInt(contact[0].params.expires) ;
  }
  else {
    expires = parseInt(res.get('expires')) ;
  }
  return expires ;
} ;