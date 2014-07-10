'use strict';
var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
var crypto = require('crypto');

var config = require('../../config/configuration.js');
var server = require('../../app.js');

describe("Image handler", function() {
  before(AnyFetchProvider.debug.cleanTokens);
  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_dropbox_access_token',
      data: config.testTokens,
      cursor: config.testCursor
    }, done);
  });

  it("should require oauth_token", function(done) {
    request(server)
      .get('/image')
      .query({
        path: 'path',
        hash: 'hash'
      })
      .expect(409)
      .expect(/specify oauth_token/)
      .end(done);
  });

  it("should require path", function(done) {
    request(server)
      .get('/image')
      .query({
        oauth_token: config.testTokens.oauth_token,
        hash: 'hash'
      })
      .expect(409)
      .expect(/specify path/)
      .end(done);
  });

  it("should require hash", function(done) {
    request(server)
      .get('/image')
      .query({
        oauth_token: config.testTokens.oauth_token,
        path: 'path',
      })
      .expect(409)
      .expect(/specify hash/)
      .end(done);
  });

  it("should require valid hash", function(done) {
    request(server)
      .get('/image')
      .query({
        oauth_token: config.testTokens.oauth_token,
        path: 'path',
        hash: 'hash'
      })
      .expect(409)
      .expect(/invalid hash/)
      .end(done);
  });


  it("should return image with valid parameters", function(done) {
    var shasum = crypto.createHash('sha1');
    shasum.update(config.testTokens.oauth_token);
    shasum.update(config.testImagePath);
    shasum.update(config.appSecret);
    var hash = shasum.digest('hex').toString();

    request(server)
      .get('/image')
      .query({
        oauth_token: config.testTokens.oauth_token,
        path: config.testImagePath,
        hash: hash,
        size: 's'
      })
      .expect(200)
      .end(done);
  });
});
