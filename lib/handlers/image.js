'use strict';

var restify = require('restify');
var crypto = require('crypto');

var config = require('../../config/configuration.js');


module.exports.get = function(req, res, next) {
  // All params must be here
  if(!req.params.token_id) {
    return next(new restify.MissingParameterError("Specify token_id"));
  }
  if(!req.params.url) {
    return next(new restify.MissingParameterError("Specify url"));
  }
  if(!req.params.hash) {
    return next(new restify.MissingParameterError("Specify hash"));
  }

  // Hash params must be valid
  var shasum = crypto.createHash('sha1');
  shasum.update(req.params.token_id);
  shasum.update(req.params.url);
  shasum.update(config.anyfetch_secret);

  if(shasum.digest('hex') !== req.params.hash) {
    return next(new restify.InvalidArgumentError("Hash does not match."));
  }

  res.send(200, "OK");
  next();
};
