'use strict';
/**
 * Provider config
 */
var dbox = require("dbox");


var config = require('../config/configuration.js');
var retrieveFiles = require('./helpers/retrieve.js').delta;
var uploadFile = require('./helpers/upload.js');

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

    /*
      { oauth_token_secret: 'sXc3perac0IOS0Q1',
        oauth_token: 'RzvOH2Wxsw4eX4ga',
        authorize_url: 'https://www.dropbox.com/1/oauth/authorize?oauth_token=RzvOH2Wxsw4eX4ga' }
    */
    cb(null, url, requestToken);
  });
};

var retrieveTokens = function(reqParams, storedParams, cb) {
  // Trade dropbox request token for access token
  dbApp.accesstoken(storedParams, function(status, dropboxAccessToken) {
    if(status !== 200) {
      return cb(new Error("Bad Dropbox status: " + status));
    }

    console.log(dropboxAccessToken);
    cb(null, 'accountName', dropboxAccessToken);
  });
};

var updateAccount = function(serviceData, cursor, queues, cb) {
  // Retrieve all files since last call
  retrieveFiles(serviceData, cursor, function(err, entries, newCursor) {
    if(err) {
      cb(err);
    }

    entries.forEach(function(entry) {
      if(!entry[1]) {
        queues.deletion.push({path: entry[0], metadata: entry[1]});
      }
      else {
        queues.addition.push({path: entry[0], metadata: entry[1]});
      }
    });

    cb(null, newCursor);
  });
};

/*var initAccount = function(req, next) {
  dbApp.requesttoken(function(status, requestToken) {
    if(status !== 200) {
      console.log("Dropbox error:", status, requestToken);
      return next(new Error("Dropbox returned with non 200 status"));
    }

    var url = requestToken.authorize_url + "&oauth_callback=" + config.providerUrl + "/init/callback";

    next(null, requestToken, url);

  });
};

var connectAccountRetrievePreDataIdentifier = function(req, next) {
  if(!req.params.oauth_token) {
    return next("oAuth parameter left out of query.");
  }

  next(null, {'data.oauth_token': req.params.oauth_token});
};

var connectAccountRetrieveAuthData = function(req, preData, next) {
  // Trade dropbox request token for access token
  dbApp.accesstoken(preData, function(status, dropboxAccessToken) {
    if(status !== 200) {
      return next(new Error("Bad Dropbox status: " + status));
    }

    next(null, dropboxAccessToken);
  });
};

var updateAccount = function(oauthToken, cursor, next) {
  // Retrieve all files since last call
  retrieveFiles(oauthToken, cursor, next);
};

var queueWorker = uploadFile;*/

var additionQueueWorker = function(job, cb) {
  uploadFile(job.task, job.anyfetchClient, job.serviceData, cb);
};

var deletionQueueWorker = function(job, cb) {
  var identifier = 'https://dropbox.com/' + job.serviceData.uid + job.task.path;

  console.log("DELING", identifier);
  job.anyfetchClient.deleteDocument(identifier, cb);
};

additionQueueWorker.concurrency = config.maxConcurrency;

module.exports = {
  connectFunctions: {
    redirectToService: redirectToService,
    retrieveTokens: retrieveTokens
  },
  updateAccount: updateAccount,
  workers: {
    addition: additionQueueWorker,
    deletion: deletionQueueWorker
  },

  config: config
};
