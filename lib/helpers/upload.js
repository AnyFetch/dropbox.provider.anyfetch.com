'use strict';
var retrieve = require('./retrieve.js');
var config = require('../../config/configuration.js');
var crypto = require('crypto');
var path = require('path');
var generateTitle = require('anyfetch-provider').util.generateTitle;


/**
 * Build a uuid for each DB file.
 *
 * @param {int} uid User ID (available on the tokens)
 * @param {path} path File path
 */
var _identifier = function(uid, path) {
  return 'https://dropbox.com/' + uid + path;
};

var uploadFile = function(identifier, metadata, dropboxTokens, anyfetchClient, cache, job, cb) {
  console.log("UPLOADING", identifier);
  var filename = metadata.path.substr(metadata.path.lastIndexOf('/') + 1);

  var shasum = crypto.createHash('sha1');
  shasum.update(dropboxTokens.oauth_token);
  shasum.update(metadata.path);
  shasum.update(config.appSecret);
  var hash = shasum.digest('hex').toString();

  var document = {
    identifier: identifier,
    actions: {
    },
    creation_date: metadata.modified,
    modification_date: metadata.modified,
    metadata: {
      path: metadata.path,
      title: generateTitle(metadata.path)
    },
    data: {},
    document_type: "file",
    user_access: [anyfetchClient.accessToken]
  };

  if(metadata.thumb_exists) {
    document.data.thumb = config.providerUrl + "/image?size=m&oauth_token=" + dropboxTokens.oauth_token + "&path=" + encodeURIComponent(metadata.path) + "&hash=" + hash;
    document.data.display = config.providerUrl + "/image?size=xl&oauth_token=" + dropboxTokens.oauth_token + "&path=" + encodeURIComponent(metadata.path) + "&hash=" + hash;

    if(metadata.mime_type.indexOf('png') !== -1) {
      document.data.thumb += "&format=png";
      document.data.display += "&format=png";
    }
  }

  retrieve.getFile(dropboxTokens, metadata.path, cache, function(status, reply, headers) {
    if(status !== 200 || !reply) {
      if(reply.toString().match(/rate limiting/i)) {
        var retryTime = parseFloat(headers['retry-after']) + 5;
        console.warn("Retry limit, we will retry in " + retryTime + " sec");

        return job.ctx.pause(function(err) {
          // Backup this task
          job.state('inactive').save();

          if(!err) {
            setTimeout(function() {
              job.ctx.resume();
            }, retryTime * 1000);
          }

          cb(err);
        }, 1000);
      }

      return cb(new Error("Failure to retrieve data or empty file: " + reply.toString()));
    }

    document.actions.show = "http://dropbox.com/home" + path.dirname(metadata.path) + "?select=" + encodeURIComponent(path.basename(metadata.path));

    // File to send
    var fileConfig = {
      file: reply,
      filename: filename,
      knownLength: reply.length
    };

    // Let's roll.
    anyfetchClient.sendDocumentAndFile(document, fileConfig, cb);
  });
};

/**
 * Run the task of uploading a document to AnyFetch.
 * This function will be used as a queue
 * @see https://github.com/caolan/async#queueworker-concurrency
 *
 * @param {Object} task Task param
 * @param {Function} cb Callback once task has been processed.
 */
module.exports = function(task, anyfetchClient, dropboxTokens, cache, job, cb) {
  var loggerCb = function(err) {
    if(err) {
      console.log(err.toString());
    }
    cb();
  };

  var identifier = _identifier(dropboxTokens.uid, task.path);
  return uploadFile(identifier, task.metadata, dropboxTokens, anyfetchClient, cache, job, loggerCb);
};
