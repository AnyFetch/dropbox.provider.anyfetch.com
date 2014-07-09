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
