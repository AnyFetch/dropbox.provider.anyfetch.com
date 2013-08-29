// # app
// Configures the application

// Load configuration and initialize server
var restify = require('restify');
var mongoose = require('mongoose');
var configuration = require('./config/configuration.js');
var lib = require("./lib/provider-dropbox");
var handlers = lib.handlers;
var middleware = lib.middleware;
var server = restify.createServer();

// Connect mongoose
mongoose.connect(configuration.mongo_url);

// Middleware Goes Here
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// Load routes
require("./config/routes.js")(server, handlers);

// Expose the server
module.exports = server;
