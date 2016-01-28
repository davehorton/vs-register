//const dns = require('dns');
const drachtio = require('drachtio') ;
var app = drachtio() ;
const argv = require('minimist')(process.argv.slice(2));
const debug = require('debug')(process.argv[0]) ;
const _ = require('lodash') ;


if( !argv.user || !argv.password || !argv.domain ) {
  console.error('usage: node app.js --domain yyyy.com --user f00 --password bar') ;
  process.exit(-1) ;
}

const uri = 'sip:' + argv.user + '@' + argv.domain ;
const contact = '<' + uri + '>;expires=3600'; 

debug(`uri: ${uri}`) ;
debug(`contact: ${contact}`) ;

app.connect({
  host: 'localhost',
  port: 8022,
  secret: 'cymru'
}) ;
app.on('connect', function() {
  debug('connected') ;
  run() ;
}) ;

function run() {
  app.request({
      uri: uri,
      method: 'REGISTER',
      headers: {
          To: uri,
          From: uri,
          Contact: contact
      },
      username: argv.user,
      password: argv.password
  }, function( err, req ) {
    debug(`sent request: ${JSON.stringify(req)}`) ;
    req.on('response', function(res) {
      var ms = calculateRtt( req.stackTime, res.stackTime ) ;
      console.log(`response status: ${res.status}`) ;
      console.log(`round trip time in ms was ${ms}`) ;
      app.disconnect() ;
    }) ;
  }) ;
}

function calculateRtt( sendTime, recvTime ) {
  debug(`send time ${sendTime} receive time ${recvTime}`) ;

  var s = _.map( sendTime.split(':'), function( item ) { return Number(item); } ) ;
  var r = _.map( recvTime.split(':'), function( item ) { return Number(item); } ) ;
  
  var ms = 0 ;

  // handle send and receive on different sides of midnight
  if( r[0] < s[0] ) { r[0] += 24; }

  ms += (r[0] - s[0]) * 60 * 60 * 1000 ;
  ms += (r[1] - s[1]) * 60 * 1000 ;
  ms += (r[2] - s[2]) * 1000 ;

  return ms.toFixed(0) ;
}













/*
dns.resolve('sip.phone.com', (err, addresses) => {
  if (err) { throw err; }

  console.log(`addresses: ${JSON.stringify(addresses)}`);

  addresses.forEach((a) => {
    dns.reverse(a, (err, hostnames) => {
      if (err) {
        throw err;
      }
      console.log(`reverse for ${a}: ${JSON.stringify(hostnames)}`);
    });
  });
});
*/