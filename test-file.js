'use strict';

var dbox = require("dbox");
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
  cursor: "AAGeRFfkuYVnZQpnJfuCctDhjCMEfSSQwZ8DWFTRKZ9OA1gU0wRu1bnkxV4SHF8KNbbg5_CKoZ91RfOhzgf0AaRM4kzsGifEuP-og7c8pMowPsrGYQJ2Glj7m2dcOdztfi_1KSKjA0XYnEpyiublB0cSAkYIBqgZKbej7btv_jqdeTmuvh3w8OwgC0OkiOJx0TEutN4Gnkoxs51LdrCijaHOrZ1va5M6wdOzyfQa0-9HtsT4Xkvn_d3wVRuynTtALVE"
};

client.delta(options, function(status, reply){
  console.log(status);
  console.log(require('util').inspect(reply, true, 50));
  process.exit();
});
