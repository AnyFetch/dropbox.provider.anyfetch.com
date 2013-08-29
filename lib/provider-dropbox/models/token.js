'use strict';
/**
 * @file Model for Token
 *
 * Every connected user from Cluestr has one, mapping its Cluestr token to a set of Dropbox tokens.
 */
var mongoose = require('mongoose');

var TokenSchema = new mongoose.Schema({
  // Access token to communicate with Cluestr
  cluestrToken: '',

  // Refresh token to communicate with Dropbox
  dropboxTokens: {},

  dropboxRequestTokens: {},

  // Last result from /delta call
  cursor: {type: Date, required: true, default:new Date(1970, 0, 1)},
});

// Register & export the model
module.exports = mongoose.model('Token', TokenSchema);
