'use strict';
/**
 * Provider config
 */
var dbox = require("dbox");
var async = require("async");
var Cluestr = require("cluestr");


var config = require('../../config/configuration.js');
var retrieveFiles = require('./helpers/retrieve.js');
var uploadFile = require('./helpers/upload.js');

var dbApp = dbox.app({
  "app_key": config.dropbox_id,
  "app_secret": config.dropbox_secret,
});


var initAccount = function(req, next) {
  dbApp.requesttoken(function(status, requestToken) {
    console.log("Status", status);

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

var updateAccount = function(refreshToken, cursor, next) {
  // Retrieve all contacts since last call
  if(!cursor) {
    cursor = new Date(1970);
  }
  var newCursor = new Date();

  retrieveFiles(refreshToken, cursor, function(err, contacts) {
    next(err, contacts, newCursor);
  });
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
  connectUrl: config.connect_url
};
