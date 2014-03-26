'use strict';

var async = require('async');
var restify = require('restify');
var crypto = require('crypto');
var dbox = require("dbox");
var anyfetchProvider = require('anyfetch-provider');
var mongoose = require('mongoose');

var config = require('../../config/configuration.js');


module.exports.get = function(req, res, next) {


  async.waterfall([
    function noMissingParameters(cb) {
      // All params must be here
      if(!req.params.token_id) {
        return cb(new restify.MissingParameterError("specify token_id"));
      }
      if(!req.params.path) {
        return cb(new restify.MissingParameterError("specify path"));
      }
      if(!req.params.hash) {
        return cb(new restify.MissingParameterError("specify hash"));
      }

      cb();
    },
    function checkValidHash(cb) {
      // Hash params must be valid
      var shasum = crypto.createHash('sha1');
      shasum.update(req.params.token_id);
      shasum.update(req.params.path);
      shasum.update(config.anyfetch_secret);
      var validHash = shasum.digest('hex').toString();

      if(validHash !== req.params.hash) {
        return cb(new restify.InvalidArgumentError("invalid hash"));
      }

      cb();
    },
    function retrieveToken(cb) {
      anyfetchProvider.retrieveDatas({_id:mongoose.Types.ObjectId(req.params.token_id)}, cb);
    },
    function retrieveThumbnail(oauthToken, cb) {
      var app = dbox.app({
        "app_key": config.dropbox_id,
        "app_secret": config.dropbox_secret
      });

      var client = app.client(oauthToken);
      var options = {
        root: "dropbox"
      };

      client.thumbnails('/' + req.params.path, options, function(status, reply, metadatas) {
        var err;
        if(status !== 200) {
          err = new Error("Invalid Dropbox status code:" + status);
        }

        cb(err, reply, metadatas);
      });
    },
    function sendThumbnail(reply, metadatas, cb) {
      res.send(reply);
      cb();
    }
  ], next);


};
