'use strict';
/**
 * @file Retrieve files from the account
 */
var dbox = require("dbox");
var fs = require("dbox");

var config = require('../../../config/configuration.js');

var app   = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret
});


/**
 * Retrieve all files associated with this user account,
 *
 * @param {Object} oauthToken Access_token to identify the account
 * @param {String} cursor Last cursor
 * @param {Function} cb Callback. First parameter is the error (if any), then an objects containing three keys: cursors, files and deletedFiles.
 */
module.exports.delta = function(oauthToken, cursor, cb) {
  var client = app.client(oauthToken);
  client.delta({cursor: cursor}, function(status, reply) {
    if(status !== 200) {
      return cb(reply);
    }

    /**
     * Only retrieve files (removes folder)
     */
    var filterForFiles = function(entry) {
      return entry[1] && !entry[1].is_dir;
    };

    /**
     * Only retrieve deleted files
     */
    var filterForDeletedFiles = function(entry) {
      return entry[1] && entry[1].is_dir;
    };

    /**
     * Retrieve path for the file
     */
    var mapFiles = function(entry) {
      return entry[0];
    };

    var files = reply.entries.filter(filterForFiles).map(mapFiles);
    var deletedFiles = reply.entries.filter(filterForDeletedFiles).map(mapFiles);

    // Send files
    cb(null, {
      cursor: reply.cursor,
      files: files,
      deletedFiles: deletedFiles
    });
  });
};


/**
 * Retrieve a single file data,
 *
 * @param {Object} oauth_token Access_token to identify the account
 * @param {String} path File path
 * @param {Function} cb Callback. First parameter is the error (if any), then an array of all the contacts.
 */
module.exports.streamFile = function(oauth_token, path) {
  var client = app.client(oauth_token);
  var options = {
    root: "dropbox"
  };

  return client.stream(path, options);
};
