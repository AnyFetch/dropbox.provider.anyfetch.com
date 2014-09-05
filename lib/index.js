'use strict';
/**
 * Provider config
 */
var dbox = require("dbox");
var path = require('path');
var CancelError = require('anyfetch-provider').CancelError;

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

/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + path;
};

var updateAccount = function(serviceData, cursor, queues, cb) {
  // Retrieve all files since last call
  retrieveFiles(serviceData, cursor, function(err, entries, newCursor) {
    if(err) {
      return cb(err);
    }
    entries.reverse().forEach(function(entry) {
      var identifier = _identifier(serviceData.uid, entry[0]);

      if(!entry[1]) {
        queues.deletion.push({identifier: identifier, title: path.basename(entry[0]), path: entry[0], metadata: entry[1]});
      }
      else {
        queues.addition.push({identifier: identifier, title: path.basename(entry[0]), path: entry[0], metadata: entry[1]});
      }
    });

    cb(null, newCursor);
  });
};

var additionQueueWorker = function(job, cb) {
  uploadFile(job.task, job.anyfetchClient, job.serviceData, job.cache, job, cb);
};

var deletionQueueWorker = function(job, cb) {
  var identifier = 'https://dropbox.com/' + job.serviceData.uid + job.task.path;

  console.log("DELETING", identifier);
  job.anyfetchClient.deleteDocumentByIdentifier(identifier, cb);
};

additionQueueWorker.concurrency = config.concurrency;
deletionQueueWorker.concurrency = config.concurrency;

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
