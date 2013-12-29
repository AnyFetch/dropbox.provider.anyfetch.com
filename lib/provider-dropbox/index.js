'use strict';
/**
 * Provider config
 */
var dbox = require("dbox");
var restify = require("restify");


var config = require('../../config/configuration.js');
var retrieveFiles = require('./helpers/retrieve.js').delta;
var uploadFile = require('./helpers/upload.js');

var dbApp = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret,
});

 
var initAccount = function(req, next) {
  dbApp.requesttoken(function(status, requestToken) {
    if(status !== 200) {
      return next(new restify.InternalError("Dropbox returned with non 200 status"));
    }

    var url = requestToken.authorize_url + "&oauth_callback=" + config.dropbox_callback;
    
    next(null, requestToken, url);

  });
};

var connectAccountRetrievePreDatasIdentifier = function(req, next) {
  if(!req.params.oauth_token) {
    return next("oAuth parameter left out of query.");
  }

  next(null, {'datas.oauth_token': req.params.oauth_token});
};

var connectAccountRetrieveAuthDatas = function(req, preDatas, next) {
  // Trade dropbox request token for access token
  dbApp.accesstoken(preDatas, function(status, dropboxAccessToken) {
    if(status !== 200) {
      return next(new Error("Bad Dropbox status: " + status));
    }

    next(null, dropboxAccessToken);
  });
};

var updateAccount = function(oauthToken, cursor, next) {
  // Retrieve all files since last call
  retrieveFiles(oauthToken, cursor, next);
};

var queueWorker = uploadFile;

module.exports = {
  initAccount: initAccount,
  connectAccountRetrievePreDatasIdentifier: connectAccountRetrievePreDatasIdentifier,
  connectAccountRetrieveAuthDatas: connectAccountRetrieveAuthDatas,
  updateAccount: updateAccount,
  queueWorker: queueWorker,

  cluestrAppId: config.cluestr_id,
  cluestrAppSecret: config.cluestr_secret,
  connectUrl: config.dropbox_connect,
  concurrency: config.max_concurrency
};
