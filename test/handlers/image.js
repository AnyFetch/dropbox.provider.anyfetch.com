'use strict';
var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
var crypto = require('crypto');

var config = require('../../config/configuration.js');
var server = require('../../app.js');

describe.only("Image handler", function() {
  var token;

  before(AnyFetchProvider.debug.cleanTokens);
  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_dropbox_access_token',
      datas: config.test_tokens,
      cursor: process.test_cursor
    }, function(err, _token) {
      token = _token;
      done(err);
    });
  });

  it("should require token_id", function(done) {
    request(server)
      .get('/image')
      .query({
        path: 'path',
        hash: 'hash'
      })
      .expect(409)
      .expect(/specify token_id/)
      .end(done);
  });

  it("should require path", function(done) {
    request(server)
      .get('/image')
      .query({
        token_id: token._id.toString(),
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
        token_id: token._id.toString(),
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
        token_id: token._id.toString(),
        path: 'path',
        hash: 'hash'
      })
      .expect(409)
      .expect(/invalid hash/)
      .end(done);
  });


  it("should return image with valid parameters", function(done) {
    var shasum = crypto.createHash('sha1');
    shasum.update(token._id.toString());
    shasum.update(config.test_image_path);
    shasum.update(config.anyfetch_secret);
    var hash = shasum.digest('hex').toString();

    request(server)
      .get('/image')
      .query({
        token_id: token._id.toString(),
        path: config.test_image_path,
        hash: hash
      })
      .expect(200)
      .end(done);
  });
});
