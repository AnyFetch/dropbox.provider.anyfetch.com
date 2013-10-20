'use strict';
/**
 * @file Upload all contacts from all accounts modified since last call to upload.
 * 
 */

var async = require('async');
var Cluestr = require('cluestr');

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
var uploadFile = function(task, cb) {
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
  stream.on('error',function(err){
    console.log("HOLY SHIT.");
    console.log(task.path);
    console.log(err.stack);
  });

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


/**
 * Upload all datas from the specified account onto Cluestr.
 *
 * @param {model/Token} token Datas for the account to upload
 * @param {Function} cb Callback. First parameter is the error if any.
 */
module.exports = function(token, cb) {
  // Build our queue.
  // It will hold our creation tasks.
  // TODO: move this queue onto the server, instead of creating one per user.
  var createQueue = async.queue(uploadFile, config.max_concurrency);

  // Build our removal queue.
  // It will hold our deletion tasks.
  // TODO: move this queue onto the server, instead of creating one per user.
  
  var deleteQueue = async.queue(deleteFile, 20);

  // cluestrClient to use for this token.
  var cluestr = new Cluestr(config.cluestr_id, config.cluestr_secret);
  cluestr.setAccessToken(token.cluestrToken);

  // Warning: in some cases, delta can be very long to generate.
  retrieve.delta(token.dropboxTokens, token.cursor, function(err, files) {
    if(err) {
      return cb(err);
    }

    // Build an array of tasks to feed onto the queue.
    var createTasks = files.files.map(function(fileData) {
      return {
        path: fileData[0],
        bytes: fileData[1].bytes,
        dropboxTokens: token.dropboxTokens,
        cluestrClient: cluestr,
        accessToken: token.cluestrToken,
      };
    });
    createQueue.push(createTasks);

    var deleteTasks = files.deletedFiles.map(function(fileData) {
      return {
        path: fileData[0],
        dropboxTokens: token.dropboxTokens,
        cluestrClient: cluestr
      };
    });
    deleteQueue.push(deleteTasks);

    // Warning: we put the final callback on fileQueue, as deleteFileQueue is assumed to be faster to empty.
    // In some edge cases however, the final cb() will be called but deleteFileQueue will still be processing. This has no incidence whatsoever unless you're polling far too quickly.
    createQueue.drain = function() {
      //TODO: uncomment.
      //token.cursor = cursor;
      token.save(function(err) {
        if(err) {
          return cb(err);
        }

        cb();
      });
    };
  });
};
