'use strict';
/**
 * Provider config
 */
var dbox = require("dbox");
var CancelError = require('anyfetch-provider').CancelError;

var config = require('../config/configuration.js');

var dbApp = dbox.app({
  "app_key": config.dropboxId,
  "app_secret": config.dropboxSecret,
});

var redirectToService = function(callbackUrl, cb) {
  dbApp.requesttoken(function(status, requestToken) {
    if(status !== 200) {
      console.log("Dropbox error:", status, requestToken);
      return cb(new Error("Dropbox returned with non 200 status"));
    }

    var url = requestToken.authorize_url + "&oauth_callback=" + callbackUrl;

    cb(null, url, requestToken);
  });
};

var retrieveTokens = function(reqParams, storedParams, cb) {
  if(reqParams.not_approved) {
    return cb(new CancelError());
  }

  dbApp.accesstoken(storedParams, function(status, dropboxAccessToken) {
    if(status !== 200) {
      return cb(new Error("Bad Dropbox status: " + status));
    }

    dbApp.client(dropboxAccessToken).account(function(status, reply) {
      if(status !== 200) {
        return cb(new Error("Bad Dropbox status: " + status));
      }

      cb(null, (reply.email) ? reply.email : 'unknown', dropboxAccessToken);
    });
  });
};

module.exports = {
  connectFunctions: {
    redirectToService: redirectToService,
    retrieveTokens: retrieveTokens
  },

  config: config
};
