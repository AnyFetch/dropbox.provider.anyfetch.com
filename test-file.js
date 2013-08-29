'use strict';

var dbox  = require("dbox");
var readline = require('readline');


var config = require('./config/configuration.js');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var app   = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret
});

var client = app.client();

var options = {
  root: "dropbox"
};

client.delta(function(status, reply){
  console.log(reply);
  process.exit();
});
