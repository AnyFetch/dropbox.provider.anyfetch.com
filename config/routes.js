/**
 * @file Defines the routes available on the server

 * Will define all availables exposed HTTP paths, and their methods (GET / POST / ...).
 */
'use strict';

// Routes client requests to handlers
module.exports = function router(server, handlers) {
  // Connection phase
  server.get('/init/connect', handlers.init.connect);
  server.get('/init/callback', handlers.init.callback);
};
