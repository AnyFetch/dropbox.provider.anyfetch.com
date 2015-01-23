'use strict';
var retrieve = require('./retrieve.js');
var config = require('../../config/configuration.js');
var crypto = require('crypto');
var path = require('path');
var generateTitle = require('anyfetch-provider').util.generateTitle;
var logError = require('anyfetch-provider').util.logError;

var uploadFile = function(identifier, metadata, dropboxTokens, anyfetchClient, cache, job, cb) {
  var filename = metadata.path.substr(metadata.path.lastIndexOf('/') + 1);

  var shasum = crypto.createHash('sha1');
  shasum.update(dropboxTokens.oauth_token);
  shasum.update(metadata.path);
  shasum.update(config.appSecret);
  var hash = shasum.digest('hex').toString();

  var document = {
    identifier: identifier,
    actions: {
    },
    creation_date: metadata.modified,
    modification_date: metadata.modified,
    metadata: {
      path: metadata.path,
      title: generateTitle(metadata.path)
    },
    data: {},
    document_type: "file",
    user_access: [anyfetchClient.accessToken]
  };

  if(metadata.thumb_exists) {
    document.metadata.thumb = config.providerUrl + "/image?size=m&oauth_token=" + dropboxTokens.oauth_token + "&path=" + encodeURIComponent(metadata.path) + "&hash=" + hash;
    document.data.display = config.providerUrl + "/image?size=xl&oauth_token=" + dropboxTokens.oauth_token + "&path=" + encodeURIComponent(metadata.path) + "&hash=" + hash;

    if(metadata.mime_type.indexOf('png') !== -1) {
      document.metadata.thumb += "&format=png";
      document.data.display += "&format=png";
    }
  }

  document.actions.show = "http://dropbox.com/home" + path.dirname(metadata.path) + "?select=" + encodeURIComponent(path.basename(metadata.path));

  retrieve.getFile(dropboxTokens, metadata.path, cache, function(status, reply, headers) {
    if(status !== 200 || !reply) {
      if(reply && reply.toString().match(/rate limiting/i)) {
        var retryTime = parseFloat(headers['retry-after']) + 5;
        console.warn("Retry limit, we will retry in " + retryTime + " sec");

        return setTimeout(function() {
          uploadFile(identifier, metadata, dropboxTokens, anyfetchClient, cache, job, cb);
        }, (retryTime + 10) * 1000);
      }

      logError(new Error("Failure to retrieve data or empty file"), {
        reply: (reply ? reply.toString() : 'No content'),
        status: status,
        identifier: identifier,
        show: document.actions.show
      });

      return cb();
    }

    // File to send
    var fileConfig = {
      file: reply,
      filename: filename,
      knownLength: reply.length
    };

    // Let's roll.
    anyfetchClient.sendDocumentAndFile(document, fileConfig, cb);
  });
};

/**
 * Run the task of uploading a document to AnyFetch.
 * This function will be used as a queue
 * @see https://github.com/caolan/async#queueworker-concurrency
 *
 * @param {Object} task Task param
 * @param {Function} cb Callback once task has been processed.
 */
module.exports = function(task, anyfetchClient, dropboxTokens, cache, job, cb) {
  return uploadFile(task.identifier, task.metadata, dropboxTokens, anyfetchClient, cache, job, cb);
};
