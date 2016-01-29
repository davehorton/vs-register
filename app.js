'use strict' ;

const drachtio = require('drachtio') ;
const app = drachtio() ;
const register = require('./lib/register') ;
const argv = require('minimist')(process.argv.slice(2));
const debug = require('debug')(process.argv[0]) ;

if( !argv.user || !argv.password || !argv.domain ) {
  console.error('usage: node app.js --domain yyyy.com --user f00 --password bar') ;
  process.exit(-1) ;
}

const uri = 'sip:' + argv.user + '@' + argv.domain ;

app.connect({
  host: 'localhost',
  port: 8022,
  secret: 'cymru'
}) ;

app.on('connect', function(sipHost) {
  debug(`listening on ${sipHost}`) ;
  
  doRegister() ;

}) ;

function doRegister() {
  register(app, {
    uri: uri,
    contact: '<' + uri + '>;expires=' + (argv.expires || 3600),
    user: argv.user,
    password: argv.password
  }, function(err, results) {
    if( err ) {
      throw err ;
    }
    console.log('%s: ', new Date(), results) ;

    setTimeout( doRegister, results.expires ? (results.expires - 5) * 1000 : 30000) ;
  }) ;
}
