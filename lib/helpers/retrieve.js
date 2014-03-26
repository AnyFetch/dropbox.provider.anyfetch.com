'use strict';
/**
 * @file Retrieve files from the account
 */
var dbox = require("dbox");

var config = require('../../config/configuration.js');

var getApp = function(oauthToken) {
  var app = dbox.app({
    "app_key": config.dropbox_id,
    "app_secret": config.dropbox_secret
  });

  return app.client(oauthToken);
};


/**
 * Retrieve all files associated with this user account,
 *
 * @param {Object} oauthToken Access_token to identify the account
 * @param {String} cursor Last cursor
 * @param {Function} cb Callback. First parameter is the error (if any), then the files metadatas, then the new cursor.
 */
module.exports.delta = function(oauthToken, cursor, cb) {
  console.log(oauthToken);
  var client = getApp(oauthToken);
  var options = {};
  if(cursor) {
    options.cursor = cursor;
  }

  client.delta(options, function(status, reply) {
    if(status !== 200) {
      return cb(reply);
    }


    // Filter for directories, while keeping removed files
    var entries = reply.entries.filter(function(entry) {
      if(!entry[1]) {
        // Keep deleted files
        return true;
      }

      if(entry[1].is_dir) {
        // Don't keep directory names / empty folders
        return false;
      }

      if(entry[1].bytes > 50 * 1000000) {
        // Only keep files under 50Mb.
        return false;
      }

      return true;
    });

    // Send files
    cb(null, entries, reply.cursor);
  });
};


/**
 * Retrieve a single file data,
 *
 * @param {Object} oauth_token Access_token to identify the account
 * @param {String} path File path
 */
module.exports.streamFile = function(oauth_token, path) {
  var client = getApp(oauth_token);
  var options = {
    root: "dropbox"
  };

  return client.stream(path, options);
};


/**
 * Retrieve a single file data,
 *
 * @param {Object} oauth_token Access_token to identify the account
 * @param {String} path File path
 */
module.exports.getFile = function(oauth_token, path, cb) {
  var client = getApp(oauth_token);
  var options = {
    root: "dropbox"
  };

  return client.get(path, options, cb);
};
