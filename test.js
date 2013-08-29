'use strict';

var Dropbox = require('dropbox');

var config = require('./config/configuration.js');

// Server-side applications use both the API key and secret.
var client = new Dropbox.Client({
  key: config.dropbox_id,
  secret: config.dropbox_secret
});

client.authenticate(function(error, client) {
  if(error) {
    throw error;
  }

  // Replace with a call to your own application code.
  //
  // The user authorized your app, and everything went well.
  // client is a Dropbox.Client instance that you can use to make API calls.
  doSomethingCool(client);
});
