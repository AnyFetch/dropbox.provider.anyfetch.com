'use strict';

var dbox = require("dbox");
var readline = require('readline');

var config = require('./config/configuration.js');


var config = require('./config/configuration.js');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var app   = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret
});

var client = app.client(config.test_tokens);

var options = {
  root: "dropbox"
};

client.get('/ic_launcher-web.png', options, function(status, reply, metadata){
  if(status !== 200) {
    throw reply;
  }

  console.log(reply.toString());
});
