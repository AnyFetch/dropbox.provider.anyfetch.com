'use strict';
/**
 * @file Upload all contacts from all accounts modified since last call to upload.
 * 
 */

var retrieve = require('../helpers/retrieve.js');


/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + path;
};

var uploadFile = function(identifier, metadatas, dropboxTokens, cluestrClient, cb) {
  console.log("UPPING", identifier);

  var filename = metadatas.path.substr(metadatas.path.lastIndexOf('/') + 1);
  var title = filename;
  if(title.lastIndexOf('.') !== -1) {
    title = title.substr(0, filename.lastIndexOf('.'));
  }
  title = title.replace('/_-/', ' ');

  var document = {
    identifier: identifier,
    actions: {
      'show': 'https://www.dropbox.com/home' + encodeURIComponent(metadatas.path)
    },
    metadatas: {
      title: title,
      path: metadatas.path
    },
    binary_document_type: "file",
    user_access: [cluestrClient.accessToken]
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
    cluestrClient.sendDocumentAndFile(document, fileConfig, cb);
  });
};

var deleteFile = function(identifier, cluestrClient, cb) {
  console.log("DELING", identifier);
  cluestrClient.deleteDocument(identifier, cb);
};


/**
 * Run the task of uploading a document to Cluestr.
 * This function will be used as a queue
 * @see https://github.com/caolan/async#queueworker-concurrency
 *
 * @param {Object} task Task param (keys: `dropboxTokens`, `path`, `cluestrClient`)
 * @param {Function} cb Callback once task has been processed.
 */
module.exports = function(task, cluestrClient, dropboxTokens, cb) {
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
    return deleteFile(identifier, cluestrClient, throwCb);
  }
  else {
    // Upload file onto Cluestr
    return uploadFile(identifier, metadatas, dropboxTokens, cluestrClient, throwCb);
  }
};
