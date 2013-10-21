'use strict';

var dbox  = require("dbox");
var readline = require('readline');


var config = require('./config/configuration.js');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var app = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret,
});

app.requesttoken(function(status, requestToken){
  if(status !== 200) {
    console.log(requestToken);
    throw new Error("Unable to retrieve datas. Check your app_id / secret.");
  }

  console.log('Visit the url: ', requestToken.authorize_url);
  rl.question('Press enter after grant.', function() {

    app.accesstoken(requestToken, function(status, accessToken){
      console.log("Set this value in your DROPBOX_TEST_* environment: ", accessToken.oauth_token);
      console.log(accessToken);
      process.exit();
    });
  });
});
