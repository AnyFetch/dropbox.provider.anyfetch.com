'use strict';
/**
 * @file Define initial handlers,
 *
 * This retrieves access_token for both Google and Cluestr.
 *
 */

var restify = require('restify');
var dbox = require("dbox");

var config = require('../../../config/configuration.js');
var TempToken = require('../models/temp-token.js');
var Token = require('../models/token.js');
var app = dbox.app({
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
    return next(new Error("Missing code parameter."));
  }

  app.requesttoken(function(status, requestToken) {
    var url = requestToken.authorize_url + "&oauth_callback=" + config.dropbox_callback;
    
    res.send(302, null, {
      Location: url
    });
    
    // Hold temporary state
    var tempToken = new TempToken({
      cluestrToken: req.params.code,
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
  var requestToken = req.params.oauth_token;

  // Retrieve temp token
  TempToken.findOne({'dropboxTokens.oauth_token': requestToken}, function(err, tempToken) {
    if(err) {
      return next(err);
    }
    console.log("TZOLENAAKN");

    app.accesstoken(tempToken.dropboxTokens, function(status, accessToken) {

      // Save for future access in MongoDB
      var token = new Token({
        cluestrToken: tempToken.cluestrToken,
        dropboxTokens: accessToken
      });

      token.save(function(err) {
        if(err) {
          return next(err);
        }

        // Redirect to Cluestr page
        res.send(302, null, {
          Location: 'http://cluestr.com/'
        });

        // Clean up now useless tempToken
        tempToken.delete(next);
      });
    });
  });
};
