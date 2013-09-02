'use strict';
/**
 * @file Upload all contacts from all accounts modified since last call to upload.
 * 
 */

var request = require('request');
var async = require('async');
var Cluestr = require('./cluestr.js');

var config = require('../../../config/configuration.js');
var retrieve = require('../helpers/retrieve.js');
var Token = require('../models/token.js');


/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + '/' + path;
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

  // Download the file from DB servers
  retrieve.file(task.dropboxTokens, task.path, function(err, file) {
    if(err) {
      return cb(err);
    }

    // Build additional datas
    var actions = {
      'show': 'https://www.dropbox.com/home' + encodeURIComponent(task.path)
    };

    // Object to send
    var datas = {
      identifier: _identifier(task.dropboxTokens.uid, task.path),
      metadatas: {
      }
    };

    // File to send
    var fileConfig = {
      file: file,
      filename: task.path.substr(task.path.lastIndexOf('/') + 1)
    };

    // Let's roll.
    console.log('UPPING', datas.identifier);
    task.cluestrClient.sendDocumentAndFile(datas, fileConfig, cb);
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
 * Sync all files from all users to Cluestr.
 * Note: only the files modified since last run will be uploaded
 * 
 * @param {Function} next Callback to call once all file from all acounts have been uploaded. First parameter is the error (if any)
 */
// 
module.exports = function (cb) {
  /**
   * Update a Token model
   * Save new cursor
   * @see https://www.dropbox.com/developers/core/docs#delta
   *
   * @param {model/Token} token Token to update
   * @param {String} cursor New cursor
   * @param {Function} cb Callback.
   */
  var updateTokenCursor = function(token, cursor, cb) {
    token.cursor = cursor;
    token.save(function(err) {
      if(err) {
        return cb(err);
      }

      cb();
    });
  };

  // Build our queue.
  // It will hold our creation tasks.
  var createQueue = async.queue(uploadFile, 5);

  // Build our removal queue.
  // It will hold our deletion tasks.
  var deleteQueue = async.queue(deleteFile, 20);

  Token.find({}, function(err, tokens) {
    if(err) {
      return cb(err);
    }

    // Download deltas datas for each account, and upload modifications
    var stack = tokens.map(function(token) {
      return function(cb) {
        retrieve.delta(token.dropboxTokens, token.cursor, function(err, files) {
          if(err) {
            cb(err);
          }

          var cluestr = new Cluestr(config.cluestr_id, config.cluestr_secret);
          cluestr.setAccessToken(token.cluestrToken);

          // Build the queue for this account
          var createTasks = files.files.map(function(path) {
            return {
              path: path,
              dropboxTokens: token.dropboxTokens,
              cluestrClient: cluestr
            };
          });
          createQueue.push(createTasks);

          var deleteTasks = files.deletedFiles.map(function(path) {
            return {
              path: path,
              dropboxTokens: token.dropboxTokens,
              cluestrClient: cluestr
            };
          });
          deleteQueue.push(deleteTasks);

          cb();
        });
      };
    });

    // Real run for the account
    async.parallel(stack, function(err) {
      // Warning: we put the final callback on fileQueue, as deleteFileQueue is assumed to be faster to empty.
      // In some edge cases however, the final cb() will be called but deleteFileQueue will still be processing. This has no incidence whatsoever unless you're polling far too quickly.
      createQueue.drain = cb;
    });
  });
};
