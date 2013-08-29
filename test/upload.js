'use strict';

var should = require('should');
var async = require('async');

var config = require('../config/configuration.js');
var providerGoogleContact = require('../lib/provider-google-contact');
var Token = providerGoogleContact.models.Token;

describe("Upload code", function () {
  it("should not raise any exception", function (done) {
    // It is quite hard to really test the upload code,
    // Therefore we'll only check no errors are raised.
    // For faster test, we won't upload.
    config.cluestr_url = 'http://test/';

    var token = new Token({
      cluestrToken: '123TEST',
      googleToken: config.test_refresh_token
    });

    async.series([
      // Create a fake CluestrToken
      function(cb) {
        token.save(function(err) {
          if(err) {
            throw err;
          }
          cb();
        });
      },
      // Retrieve associated contacts
      function(cb) {
        providerGoogleContact.helpers.upload(cb);
      }
    ], done);
  });
});
