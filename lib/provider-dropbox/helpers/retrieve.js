'use strict';
/**
 * @file Retrieve contacts for the account
 */

var config = require('../../../config/configuration.js');
var mapper = require('../helpers/mapper.js');
var request = require('request');

/**
 * Use the Google refresh token to get a new access_token,
 *
 * @param {String} refresh_token Refresh token issued by Google
 * @param {Function} cb First parameter is the error (if any), then the new access_token (valid for one hour)
 */
var refreshAccessToken = function(refresh_token, cb) {

  // See https://developers.google.com/accounts/docs/OAuth2WebServer#refresh for details
  var params = {
    url: 'https://accounts.google.com/o/oauth2/token',
    form: {
      'refresh_token': refresh_token,
      'client_id': config.google_id,
      'client_secret': config.google_secret,
      'grant_type': 'refresh_token'
    },
    json: true
  };

  request.post(params, function (err, resp, body) {
    if(err){
      return cb(err);
    }

    if(resp.statusCode === 401){
      return cb(new Error("Access to this refresh_token has been revoked."));
    }

    cb(null, resp.body.access_token);
  });
};

/**
 * Retrieve all contacts associated with this user account,
 *
 * @param {String} access_token Access_token to identify the account
 * @param {Date} since Retrieve contacts updated since this date
 * @param {Function} cb Callback. First parameter is the error (if any), then an array of all the contacts.
 */
var retrieveContacts = function(access_token, since, cb) {

  // Pad n to have a length of width,
  // pad(1, 3) == 001
  var pad = function(n, width) {
    width = width || 2;
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(0) + n;
  };

  // Date, formatted as 2007-03-16T00:00:00
  var formattedDate = since.getFullYear() + '-' + pad(since.getMonth() + 1) + '-' + pad(since.getDate()) + 'T' + pad(since.getHours()) + ':' + pad(since.getMinutes()) + ':' + pad(since.getSeconds());

  // See https://developers.google.com/google-apps/contacts/v3/?csw=1#retrieving_contacts_using_query_parameters for details
  var params = {
    url: 'https://www.google.com/m8/feeds/contacts/default/full',
    qs: {
      alt: 'json',
      'max-results': 100000,
      'showdeleted': true,
      'orderby': 'lastmodified',
      'updated-min': formattedDate
    },
    headers: {
      'Authorization': 'OAuth ' + access_token,
      'GData-Version': '3.0'
    },
    json: true
  };

  request.get(params, function (err, resp, body) {
    if(err) {
      return cb(err);
    }
    if(resp.statusCode === 401){
      return cb (new Error("Wrong Google Authorization provided."));
    }

    var contacts = body.feed.entry ? body.feed.entry.map(mapper):[];

    // Contacts is now full!
    cb(null, contacts);
  });
};

/**
 * Download all contacts from the specified Google Account.
 *
 * @param {String} refresh_token Refresh_token to identify the account
 * @param {Date} since Retrieve contacts updated since this date
 * @param {Function} cb Callback. First parameter is the error (if any), second an array of all the contacts.
 */
module.exports = function(refresh_token, since, cb) {
  refreshAccessToken(refresh_token, function(err, access_token) {
    if(err) {
      cb(err);
    }
    
    retrieveContacts(access_token, since, cb);
  });
};
