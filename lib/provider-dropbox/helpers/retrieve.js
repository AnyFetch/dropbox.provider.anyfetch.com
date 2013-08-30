'use strict';
/**
 * @file Retrieve files from the account
 */
var dbox = require("dbox");

var config = require('../../../config/configuration.js');

var app   = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret
});


/**
 * Retrieve all files associated with this user account,
 *
 * @param {Object} oauth_token Access_token to identify the account
 * @param {String} cursor Last cursor
 * @param {Function} cb Callback. First parameter is the error (if any), then an array of all the contacts.
 */
module.exports = function(oauth_token, cursor, cb) {
  var client = app.client(oauth_token);
  client.delta({cursor: cursor}, function(status, reply) {
    if(status !== 200) {
      return cb(reply);
    }

    /**
     * Only retrieve files (removes folder)
     */
    var filterForFiles = function(entry) {
      return entry[1] && entry[1].is_dir;
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
    return {
      files: files,
      deletedFiles: deletedFiles
    };
  });
};
