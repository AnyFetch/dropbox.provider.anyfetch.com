'use strict';
var retrieve = require('./retrieve.js');
var config = require('../../config/configuration.js');
var crypto = require('crypto');


/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + path;
};

var uploadFile = function(identifier, metadata, dropboxTokens, anyfetchClient, cb) {
  console.log("UPPING", identifier);
  var filename = metadata.path.substr(metadata.path.lastIndexOf('/') + 1);

  var shasum = crypto.createHash('sha1');
  shasum.update(dropboxTokens.oauth_token);
  shasum.update(metadata.path);
  shasum.update(config.anyfetch_secret);
  var hash = shasum.digest('hex').toString();

  var document = {
    identifier: identifier,
    actions: {
      'show': 'https://www.dropbox.com/home' + encodeURIComponent(metadata.path)
    },
    creation_date: metadata.modified,
    metadata: {
      path: metadata.path
    },
    data: {
    },
    document_type: "file",
    user_access: [anyfetchClient.accessToken]
  };

  if(metadata.thumb_exists) {
    document.data.thumb = config.dropbox_image + "?size=m&oauth_token=" + dropboxTokens.oauth_token + "&path=" + encodeURIComponent(metadata.path) + "&hash=" + hash;
    document.data.display = config.dropbox_image + "?size=xl&oauth_token=" + dropboxTokens.oauth_token + "&path=" + encodeURIComponent(metadata.path) + "&hash=" + hash;

    if(metadata.mime_type.indexOf('png') !== -1) {
      document.data.thumb += "&format=png";
      document.data.display += "&format=png";
    }
  }

  // Stream the file from DB servers
  retrieve.getFile(dropboxTokens, metadata.path, function(status, reply) {
    if(status !== 200 || !reply) {
      return cb(new Error("Failure to retrieve data or empty file: ", [identifier, status, reply]));
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

var deleteFile = function(identifier, anyfetchClient, cb) {
  console.log("DELING", identifier);
  anyfetchClient.deleteDocument(identifier, cb);
};


/**
 * Run the task of uploading a document to AnyFetch.
 * This function will be used as a queue
 * @see https://github.com/caolan/async#queueworker-concurrency
 *
 * @param {Object} task Task param
 * @param {Function} cb Callback once task has been processed.
 */
module.exports = function(task, anyfetchClient, dropboxTokens, cb) {
  var loggerCb = function(err) {
    if(err) {
      console.log(err.toString());
    }
    cb();
  };

  var path = task[0];
  var metadata = task[1];

  var identifier = _identifier(dropboxTokens.uid, path);
  if(!metadata) {
    // File has been removed
    return deleteFile(identifier, anyfetchClient, loggerCb);
  }
  else {
    // Upload file onto AnyFetch
    return uploadFile(identifier, metadata, dropboxTokens, anyfetchClient, loggerCb);
  }
};
