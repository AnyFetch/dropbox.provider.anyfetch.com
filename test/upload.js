'use strict';

var should = require('should');
var async = require('async');

var config = require('../config/configuration.js');
var providerDropbox = require('../lib/provider-dropbox');
var Token = providerDropbox.models.Token;

describe("Upload code", function () {
  it("should not raise any exception", function (done) {
    // It is quite hard to really test the upload code,
    // Therefore we'll only check no errors are raised.
    // For faster test, we won't upload.
    config.cluestr_url = 'http://test/';

    var token = new Token({
      cluestrToken: '123TEST',
      dropboxTokens: config.test_refresh_token,
      cursor:"AAGeRFfkuYVnZQpnJfuCctDhjCMEfSSQwZ8DWFTRKZ9OA1gU0wRu1bnkxV4SHF8KNbbg5_CKoZ91RfOhzgf0AaRM4kzsGifEuP-og7c8pMowPsrGYQJ2Glj7m2dcOdztfi_1KSKjA0XYnEpyiublB0cSAkYIBqgZKbej7btv_jqdeTmuvh3w8OwgC0OkiOJx0TEutN4Gnkoxs51LdrCijaHOrZ1va5M6wdOzyfQa0-9HtsT4Xkvn_d3wVRuynTtALVE"
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
        providerDropbox.helpers.upload(cb);
      }
    ], done);
  });
});
