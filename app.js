"use strict";

// Load configuration and initialize server
var anyfetchProvider = require('anyfetch-provider');
var serverConfig = require('./lib/');


var server = anyfetchProvider.createServer(serverConfig);
server.get('/image', require('./lib/handlers/image.js').get);

// Expose the server
module.exports = server;
