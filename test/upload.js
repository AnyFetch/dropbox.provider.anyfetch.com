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
      dropboxTokens: config.test_tokens,
      cursor:"AAHGAZxS20rjQgBQVVulcPzUCYmNf2m1KUpcEmsWOFnhGFpdDhSSRIgG-WAQQeNLYxq51l5AJDDtfD1Fox6vytTP0gn7ou7PL6Z3cMs2IADgjo2ED-YYyVLwP9D5XXaDYQlQb5vEiOtfLPu3sxObDGseyveffqn03r8iotTvoI_-wlxMa0TrngZLKlAgF_xT2lGsdpDBIxiFLXXCG-CadZvA2_2ncaCJQTjJh7ODmQ4o7pU32kOEpHsBgB31PfUP4t0"
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
