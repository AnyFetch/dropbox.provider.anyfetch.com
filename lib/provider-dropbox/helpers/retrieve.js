'use strict';
/**
 * @file Retrieve files from the account
 */
var dbox = require("dbox");

var config = require('../../../config/configuration.js');

var app = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret
});


/**
 * Retrieve all files associated with this user account,
 *
 * @param {Object} oauthToken Access_token to identify the account
 * @param {String} cursor Last cursor
 * @param {Function} cb Callback. First parameter is the error (if any), then the files metadatas, then the new cursor.
 */
module.exports.delta = function(oauthToken, cursor, cb) {
  var client = app.client(oauthToken);
  client.delta({cursor: cursor}, function(status, reply) {
    if(status !== 200) {
      return cb(reply);
    }

    // Filter for directories, while keeping removed files
    var entries = reply.entries.filter(function(entry) {
      return !entry[1] || !entry[1].is_dir;
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
  var client = app.client(oauth_token);
  var options = {
    root: "dropbox"
  };

  return client.stream(path, options);
};
