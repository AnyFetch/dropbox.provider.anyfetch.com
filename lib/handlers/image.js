'use strict';

var async = require('async');
var restify = require('restify');
var crypto = require('crypto');
var dbox = require("dbox");
var anyfetchProvider = require('anyfetch-provider');

var config = require('../../config/configuration.js');


module.exports.get = function(req, res, next) {


  async.waterfall([
    function noMissingParameters(cb) {
      // All params must be here
      if(!req.params.oauth_token) {
        return cb(new restify.MissingParameterError("specify oauth_token"));
      }
      if(!req.params.path) {
        return cb(new restify.MissingParameterError("specify path"));
      }
      if(!req.params.hash) {
        return cb(new restify.MissingParameterError("specify hash"));
      }
      req.params.format = encodeURIComponent(req.params.format || 'jpeg');
      req.params.size = encodeURIComponent(req.params.size || 'm');

      cb();
    },
    function checkValidHash(cb) {
      // Hash params must be valid
      var shasum = crypto.createHash('sha1');
      shasum.update(req.params.oauth_token);
      shasum.update(req.params.path);
      shasum.update(config.anyfetch_secret);

      var validHash = shasum.digest('hex').toString();

      if(validHash !== req.params.hash) {
        return cb(new restify.InvalidArgumentError("invalid hash"));
      }

      cb();
    },
    function retrieveToken(cb) {
      anyfetchProvider.retrieveDatas({'datas.oauth_token': req.params.oauth_token}, cb);
    },
    function retrieveThumbnail(oauthToken, cb) {
      var app = dbox.app({
        "app_key": config.dropbox_id,
        "app_secret": config.dropbox_secret
      });

      var client = app.client(oauthToken);
      var options = {
        root: "dropbox",
        size: req.params.size,
        format: req.params.format
      };

      client.thumbnails(req.params.path, options, function(status, reply, metadatas) {
        var err;
        if(status !== 200) {
          err = new Error("Invalid Dropbox status code:" + status);
          console.log("Failed to retrieve image", reply.toString());
        }

        cb(err, reply, metadatas);
      });
    },
    function sendThumbnail(reply, metadatas, cb) {
      res.writeHead(200, {
        'Content-Type': 'image/' + req.params.format
      });
      res.write(reply);
      res.end();

      cb();
    }
  ], next);


};
