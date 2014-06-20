'use strict';

var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/');



describe("Workflow", function () {

  // Create a fake HTTP server
  var frontServer = AnyFetchProvider.debug.createTestApiServer();
  frontServer.listen(1337);

  before(AnyFetchProvider.debug.cleanTokens);
  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_dropbox_access_token',
      data: config.test_tokens,
      cursor: process.test_cursor
    }, done);
  });

  it("should upload data to AnyFetch", function (done) {
    var originalQueueWorker = serverConfig.queueWorker;
    serverConfig.queueWorker = function(task, anyfetchClient, dropboxTokens, cb) {
      task.should.have.lengthOf(2);
      task[1].should.have.property('bytes');

      originalQueueWorker(task, anyfetchClient, dropboxTokens, cb);
    };
    var server = AnyFetchProvider.createServer(serverConfig);

    server.queue.drain = function() {
      done();
    };

    request(server)
      .post('/update')
      .send({
        access_token: 'fake_dropbox_access_token',
        api_url: 'http://localhost:1337'
      })
      .expect(202)
      .end(function(err) {
        if(err) {
          throw err;
        }
      });
  });
});
