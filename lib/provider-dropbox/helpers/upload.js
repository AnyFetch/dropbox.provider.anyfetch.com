'use strict';
/**
 * @file Upload all contacts from all accounts modified since last call to upload.
 * 
 */

var request = require('request');
var async = require('async');
var Cluestr = require('cluestr');

var config = require('../../../config/configuration.js');
var retrieve = require('../helpers/retrieve.js');
var Token = require('../models/token.js');


/**
 * Upload `contacts` onto Cluestr.
 *
 * 
 * @param {Array} contacts List of contacts to upload
 * @param {String} accessToken Cluestr access token (the account to upload datas on)
 * @param {Function} cb Callback to call once all contacts have been uploaded.
 */
var account_upload = function(contacts, accessToken, cb) {
  // Define the access_token to use for this batch
  var cluestr = new Cluestr(config.cluestr_id, config.cluestr_secret);
  cluestr.setAccessToken(accessToken);

  var stack = contacts.map(function(contact) {
    // Build contact "the right way"
    contact = {
      identifier: contact.url,
      metadatas: contact,
      actions: {
        'show': contact.url
      }
    };
    delete contact.metadatas.url;
    delete contact.metadatas.id;

    if(contact.deleted) {
      // Send DELETE request
      async.apply(cluestr.deleteDocument, contact.identifier);
    } else {
      // Send datas (may be a CREATE or UPDATE, we don't really care)
      return async.apply(cluestr.sendDocument, contact);
    }
  });

  // Ugly: skip when testing
  if(process.env.NODE_ENV === 'test') {
    return cb();
  }

  // Let's upload!
  async.parallel(stack, cb);
};


/**
 * Sync all contacts from all users to Cluestr.
 * Note: only the contacts modified since last run will be uploaded
 * 
 * @param {Function} next Callback to call once all contacts from all acounts have been uploaded. First parameter is the error (if any)
 */
// 
module.exports = function (cb) {
  /**
   * Update a Token model
   * Literraly saying "all contacts before `date` are up to date"
   *
   * @param {model/Token} token Token to update
   * @param {Date} Date of last successful (and full) upload
   * @param {Function} cb Callback.
   */
  var updateTokenAccess = function(token, date, cb) {
    //token.lastAccess = date;
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
    tokens.forEach(function(token) {
      stack.push(function(cb) {
        // Download contacts datas, and upload them
        retrieve(token.googleToken, token.lastAccess, function(err, contacts) {
          if(err) {
            return;
          }

          // Once the users have been retrieved,
          // Store the current date -- we'll write this onto token.lastAccess if the upload runs smoothly.
          var currentDate = new Date();
          account_upload(contacts, token.cluestrToken, function(err) {
            if(err) {
              return cb(err);
            }
            
            updateTokenAccess(token, currentDate, cb);
          });
        });
      });
    });

    // Real run
    async.parallel(stack, cb);
  });
};
