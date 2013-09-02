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
 * Upload `file` onto Cluestr.
 *
 * @param {Cluestr} cluestrClient Client to use for upload
 * @param {String} identifier Unique identifier for this file
 * @param {Buffer} file Buffer or value
 * @param {Function} cb Callback to call once all contacts have been uploaded.
 */
var uploadFile = function(cluestrClient, datas, fileConfig, cb) {
  console.log('UPPING', datas.identifier);

  // // Ugly: skip when testing
  // if(process.env.NODE_ENV === 'test') {
  //   return cb();
  // }

  // Let's upload!
  cluestrClient.sendDocumentAndFile(datas, fileConfig, cb);
};

/**
 * Delete `file` onto Cluestr.
 *
 * @param {Cluestr} cluestrClient Client to use for upload
 * @param {String} identifier Unique identifier for this file
 * @param {?} file Buffer or value
 * @param {Function} cb Callback to call once all contacts have been uploaded.
 */
var deleteFile = function(cluestrClient, identifier, cb) {
  console.log('DELING', identifier);

  // Ugly: skip when testing
  if(process.env.NODE_ENV === 'test') {
    return cb();
  }

  // Let's upload!
  cluestrClient.deleteDocument(identifier, cb);
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

  Token.find({}, function(err, tokens) {
    if(err) {
      return cb(err);
    }

    // Build query stack
    var stack = [];

    stack = tokens.map(function(token) {
      return function(cb) {
        // Download deltas datas, and upload them
        retrieve.delta(token.dropboxTokens, token.cursor, function(err, files) {
          if(err) {
            cb(err);
          }

          var cluestr = new Cluestr(config.cluestr_id, config.cluestr_secret);
          cluestr.setAccessToken(token.cluestrToken);

          var fileStack = [];
          fileStack = files.files.map(function(path) {
            return function(cb) {
              retrieve.file(token.dropboxTokens, path, function(err, file) {
                if(err) {
                  return cb(err);
                }

                var identifier = 'https://dropbox.com/' + token.dropboxTokens.uid + '/' + path;
                var actions = {
                  'show': 'https://www.dropbox.com/home' + encodeURIComponent(path)
                };

                var datas = {
                  identifier: identifier,
                  metadatas: {
                  }
                };

                var fileConfig = {
                  file: file,
                  filename: path.substr(path.lastIndexOf('/') + 1)
                };

                uploadFile(cluestr, datas, fileConfig, cb);
              });
            };
          });

          var deletedFileStack = [];
          deletedFileStack = files.deletedFiles.map(function(path) {
            return function(cb) {
              var identifier = 'https://dropbox.com/' + token.dropboxTokens.uid + '/' + path;

              deleteFile(cluestr, identifier, cb);
            };
          });

          // Launch everything in parallel
          async.parallel(fileStack.concat(deletedFileStack), function(err) {
            if(err) {
              cb(err);
            }

            updateTokenCursor(token, files.cursor, cb);
          });
        });
      };
    });

    // Real run
    async.parallel(stack, cb);
  });
};
