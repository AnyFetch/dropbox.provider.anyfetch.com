'use strict';

require('should');
var request = require('supertest');
var restify = require('restify');

var app = require('../app.js');
var config = require('../config/configuration.js');
var providerDropbox = require('../lib/provider-dropbox');
var Token = providerDropbox.models.Token;

describe("POST /upload", function () {
  // Create a fake HTTP server
  var server = restify.createServer();
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  server.post('/providers/documents', function(req, res, next) {
    console.log("Got document");
    if(!req.params.identifier) {
      throw new Error("No identifier");
    }
    res.send(204);
    next();
  });

  server.del('/providers/documents', function(req, res, next) {
    console.log("Removed document");
    if(!req.params.identifier) {
      throw new Error("No identifier");
    }
    res.send(204);
    next();
  });

  server.post('/providers/documents/file', function(req, res, next) {
    console.log("Got file");
    if(!req.params.identifier) {
      throw new Error("No identifier");
    }
    res.send(204);
    next();
  });

  server.listen(1337, function() {});
  process.env.CLUESTR_SERVER = 'http://localhost:1337';

  
  var token;
  before(function(done) {
    token = new Token({
      cluestrToken: '123TEST',
      dropboxTokens: config.test_tokens,
      cursor:config.test_cursor
    });

    token.save(done);
  });

  it("should not raise any exception", function (done) {
    request(app).post('/update')
      .send({access_token: token.cluestrToken})
      .expect(204)
      .end(done);
  });

  it("should upload all changes since", function(done) {
    providerDropbox.helpers.upload(token, done);
  });
});
