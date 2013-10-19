'use strict';
/**
 * @file Upload all contacts from all accounts modified since last call to upload.
 * 
 */

var config = require('../../../config/configuration.js');
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


/**
 * Run the task of uploading a document to Dropbox.
 * This function will be used as a queue
 * @see https://github.com/caolan/async#queueworker-concurrency
 *
 * @param {Object} task Task param (keys: `dropboxTokens`, `path`, `cluestrClient`)
 * @param {Function} cb Callback once task has been processed.
 */
module.exports = function(task, cb) {
  // Build additional datas
  var filename = task.path.substr(task.path.lastIndexOf('/') + 1);

  var actions = {
    'show': 'https://www.dropbox.com/home' + encodeURIComponent(task.path)
  };

  var metadatas = {
    title: filename,
    path: task.path
  };

  // Object to send
  var datas = {
    identifier: _identifier(task.dropboxTokens.uid, task.path),
    metadatas: metadatas,
    binary_document_type: "file",
    actions: actions,
    user_access: [task.accessToken]
  };

  // Stream the file from DB servers
  var stream = retrieve.streamFile(task.dropboxTokens, task.path);

  // File to send
  var fileConfig = {
    file: stream,
    filename: filename,
    knownLength: task.bytes
  };

  // Let's roll.
  console.log('UPPING', datas.identifier);
  task.cluestrClient.sendDocumentAndFile(datas, fileConfig, function(err) {
    if(err) {
      throw err;
    }
    cb(err);
  });
};


/**
 * Run the task of deleting a document on Cluestr.
 * This function will be used as a queue
 * @see https://github.com/caolan/async#queueworker-concurrency
 *
 * @param {Object} task Task param (keys: `dropboxTokens`, `path`, `cluestrClient`)
 * @param {Function} cb Callback once task has been processed.
 */
var deleteFile = function(task, cb) {
  var identifier = _identifier(task.dropboxTokens.uid, task.path);

  console.log("DELING", identifier);
  task.cluestrClient.deleteDocument(identifier, cb);
};
