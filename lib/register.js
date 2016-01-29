'use strict' ;

const calculateRtt = require('./utils').calculateRtt ;
const parseExpires = require('./utils').parseExpires ;

exports = module.exports = function(app, opts, callback) {

  var obj = {
    challenge: false
  } ;

  app.request({
      uri: opts.uri,
      method: 'REGISTER',
      headers: {
          to: opts.uri,
          from: opts.uri,
          contact: opts.contact
      },
      auth: function( req, res, callback ) {
        obj.msChallenge = calculateRtt( req.stackTime, res.stackTime ) ;
        callback(null, opts.user, opts.password) ;
      }
  }, function( err, req ) {
    if( err ) {
      return callback(err) ;
    }
    var finalRequest = req ;
    req.on('authenticate', function(req) {
      finalRequest = req ;
      obj.challenge = true ;
    }) ;
    req.on('response', function(res) {
      obj.status = res.status ;
      obj.ms = calculateRtt( finalRequest.stackTime, res.stackTime ) ;
      if( 200 === res.status ) {
        obj.expires = parseExpires(res) ;
      }
      callback(null, obj) ;
    }) ;
  }) ;

} ;