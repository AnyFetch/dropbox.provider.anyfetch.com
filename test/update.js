'use strict';

var request = require('supertest');
var should = require('should');
var async = require('async');

var app = require('../app.js');
var config = require('../config/configuration.js');
var providerDropbox = require('../lib/provider-dropbox');
var Token = providerDropbox.models.Token;

describe("POST /upload", function () {
  it("should not raise any exception", function (done) {
    // It is quite hard to really test the upload code,
    // Therefore we'll only check no errors are raised.
    // For faster test, we won't upload.
    config.cluestr_url = 'http://test/';

    var token = new Token({
      cluestrToken: '123TEST',
      dropboxTokens: config.test_tokens,
      cursor:config.test_cursor
    });

    async.series([
      // Create a fake CluestrToken
      function(cb) {
        token.save(cb);
      },
      // Retrieve files
      function(cb) {
        var req = request(app).post('/update')
          .send({access_token: token.cluestrToken})
          .expect(204)
          .end(done);
      }
    ], done);
  });
});
