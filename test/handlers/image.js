'use strict';
var request = require('supertest');
var server = require('../../app.js');

describe("Image handler", function() {
  it("should require token_id", function(done) {
    request(server)
      .get('/image')
      .query({
        url: 'url',
        hash: 'hash'
      })
      .expect(409)
      .expect(/specify token_id/)
      .end(done);
  });

  it("should require url", function(done) {
    request(server)
      .get('/image')
      .query({
        token_id: '123',
        hash: 'hash'
      })
      .expect(409)
      .expect(/specify url/)
      .end(done);
  });

  it("should require hash", function(done) {
    request(server)
      .get('/image')
      .query({
        token_id: '123',
        url: 'url',
      })
      .expect(409)
      .expect(/specify hash/)
      .end(done);
  });

  it("should require valid hash", function(done) {
    request(server)
      .get('/image')
      .query({
        token_id: '123',
        url: 'url',
        hash: 'hash'
      })
      .expect(409)
      .expect(/invalid hash/)
      .end(done);
  });
});
