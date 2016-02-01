'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/vs-dev'
  },

  seedDB: true,

  //drachtio-server connection options
  drachtioServer: {
    address: 'localhost',
    port: 8022,
    secret: 'cymru'
  },

};
