'use strict';
var retrieve = require('./retrieve.js');
var config = require('../../config/configuration.js');


/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + path;
};

var uploadFile = function(identifier, metadatas, dropboxTokens, anyfetchClient, cb) {
  console.log("UPPING", identifier);

  var filename = metadatas.path.substr(metadatas.path.lastIndexOf('/') + 1);

  var document = {
    identifier: identifier,
    actions: {
      'show': 'https://www.dropbox.com/home' + encodeURIComponent(metadatas.path)
    },
    metadatas: {
      path: metadatas.path
    },
    datas: {
      thumb: config.dropbox_image + "?"
    },
    document_type: "file",
    user_access: [anyfetchClient.accessToken]
  };

  // Stream the file from DB servers
  retrieve.getFile(dropboxTokens, metadatas.path, function(status, reply) {
    if(status !== 200 || !reply) {
      console.log("Failure to retrieve datas or empty file: ", [identifier, status, reply]);
      return cb();
    }

    // File to send
    var fileConfig = {
      file: reply,
      filename: filename,
      knownLength: reply.length
    };

    // Let's roll.
    anyfetchClient.sendDocumentAndFile(document, fileConfig, function(err, res) {
      if (err) {
        console.log(err);
      }
      cb();
    });
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
  var throwCb = function(err) {
    if(err) {
      throw err;
    }
    cb();
  };

  var path = task[0];
  var metadatas = task[1];

  var identifier = _identifier(dropboxTokens.uid, path);
  if(!metadatas) {
    // File has been removed
    return deleteFile(identifier, anyfetchClient, throwCb);
  }
  else {
    // Upload file onto AnyFetch
    return uploadFile(identifier, metadatas, dropboxTokens, anyfetchClient, throwCb);
  }
};
