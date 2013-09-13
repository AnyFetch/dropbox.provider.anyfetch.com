'use strict';
/**
 * @file Define initial handlers,
 *
 * This retrieves access_token for both Google and Cluestr.
 *
 */

var dbox = require("dbox");
var restify = require("restify");
var async = require("async");
var Cluestr = require('cluestr');

var config = require('../../../config/configuration.js');
var TempToken = require('../models/temp-token.js');
var Token = require('../models/token.js');
var dbApp = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret,
});


/**
 * This handler generates the appropriate URL and redirects the user to Dropbox consentment page.
 *
 * We require a GET `code` parameter (authorization code from Cluestr API)
 * We'll then transparently (302) redirect to Dropbox consentment page. When the user is OK, we'll be redirected back to /init/callback
 * For now, we won't do anything with the Cluestr authorization code: we'll simply pass it along to Google as `state` for later use.
 * @see http://stackoverflow.com/a/7722099/1731144
 * @see https://developers.google.com/accounts/docs/OAuth2WebServer#handlingtheresponse
 * 
 * @param {Object} req Request object from the client
 * @param {Object} res Response we want to return
 * @param {Function} next Callback to call once res has been populated.
 */
module.exports.connect = function (req, res, next) {
  if(!req.params.code) {
    return next(new restify.MissingParameterError("Missing code parameter."));
  }

  dbApp.requesttoken(function(status, requestToken) {
    var url = requestToken.authorize_url + "&oauth_callback=" + config.dropbox_callback;
    
    res.send(302, null, {
      Location: url
    });
    
    // Hold temporary state
    var tempToken = new TempToken({
      cluestrCode: req.params.code,
      dropboxTokens: requestToken
    });

    tempToken.save(function(err) {
      if(err) {
        return next(err);
      }

      next();
    });

  });

};

/**
 * The user is redirected to this handler after giving consent to Dropbox.
 *
 * Our previous request-token is now validated, and can be traded for an access_token.
 * 
 * @param {Object} req Request object from the client
 * @param {Object} res Response we want to return
 * @param {Function} next Callback to call once res has been populated.
 */
exports.callback = function (req, res, next) {
  async.waterfall([
    function(cb) {
      var requestToken = req.params.oauth_token;
      // Retrieve temp token
      TempToken.findOne({'dropboxTokens.oauth_token': requestToken}, cb);
    },
    function(tempToken, cb) {
      if(!tempToken) {
        return cb(new Error("No temptoken matching request."));
      }

      dbApp.accesstoken(tempToken.dropboxTokens, function(status, dropboxTokens) {
        if(status !== 200) {
          return cb(new Error("Bad Dropbox status: " + status));
        }

        var cluestrAuthorizationCode = tempToken.cluestrCode;
        tempToken.delete(function(err) {
          cb(err, cluestrAuthorizationCode, dropboxTokens);
        });
      });
    },
    function(cluestrAuthorizationCode, dropboxTokens, cb) {
      // Trade our authorization code for accessToken
      var cluestr = new Cluestr(config.cluestr_id, config.cluestr_secret);
      cluestr.getAccessToken(cluestrAuthorizationCode, function(err, cluestrAccessToken) {
        cb(err, cluestrAccessToken, dropboxTokens);
      });
    },
    function(cluestrAccessToken, dropboxTokens, cb) {
      // Save for future access in MongoDB
      var token = new Token({
        cluestrToken: cluestrAccessToken,
        dropboxTokens: dropboxTokens
      });

      token.save(function(err) {
        cb(err, token);
      });
    },
    function(token, cb) {
      // Redirect to Cluestr page
      res.send(302, null, {
        Location: 'http://cluestr.com/'
      });

      cb();

      // Async-uploading now.
      console.log("Starting upload.");
      require('../helpers/upload.js')(token, function(err) {
        if(err) {
          throw err;
        }
        console.log("End of upload.");
      });

    }
  ], next);
};
