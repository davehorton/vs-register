'use strict' ;

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const drachtio = require('drachtio') ;
var app = drachtio() ;
const config = app.config = require('./config/environment');
const mongoose = require('mongoose');
const argv = require('minimist')(process.argv.slice(2));
const debug = app.debug = require('debug')(process.argv[0]) ;
const winston = require('winston') ;
var watcher ;

var logger = app.logger = new winston.Logger({
  transports: config.logger.transports
});

const host = argv.address || config.drachtioServer.address ;
const port = argv.port || config.drachtioServer.port ;
const secret = argv.secret || config.drachtioServer.secret ;

app.connect({
  host: host,
  port: port,
  secret: secret
}) ;

app.on('connect', function(err, hostport) {
  if( err ) { throw err ; }
  logger.info('connected to drachtio server at %s', hostport) ;
})
.on('error', function(err){
  logger.warn(err.message ) ;
}) ;

// connect to mongo
var connectWithRetry = function() {
  return mongoose.connect(config.mongo.uri, config.mongo.options, function(err) {
    if (err) {
      logger.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
      setTimeout(connectWithRetry, 5000);
    }
  });
};
connectWithRetry();

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

mongoose.connection
.on('error', function(err){
  logger.error('mongoose connection error: ', err) ;
})
.on('connected', function() {
    logger.info('connected to mongo at %s', config.mongo.uri) ;   
    if( watcher ) {
      watcher.stop() ;
    }
    const DbWatcher = require('./lib/db-watcher') ;
    watcher = new DbWatcher() ;

    watcher.start() ;   
}) ;

// Expose app
exports = module.exports = app;

