'use strict';

var path = require('path');

var retrieveFiles = require('./helpers/retrieve.js').delta;

/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + path;
};

module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all files since last call
  delete serviceData.documentsPerUpdate;
  retrieveFiles(serviceData, cursor, function(err, entries, newCursor) {
    if(err) {
      return cb(err);
    }
    entries.reverse().forEach(function(entry) {
      var identifier = _identifier(serviceData.uid, entry[0]);

      if(!entry[1]) {
        if(cursor) {
          queues.deletion.push({identifier: identifier, title: path.basename(entry[0]), path: entry[0], metadata: entry[1]});
        }
      }
      else {
        queues.addition.push({identifier: identifier, title: path.basename(entry[0]), path: entry[0], metadata: entry[1]});
      }
    });

    cb(null, newCursor);
  });
};
