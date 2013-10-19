'use strict';

var request = require('supertest');
var CluestrProvider = require('cluestr-provider');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/provider-dropbox');



describe("Workflow", function () {
// Create a fake HTTP server
  process.env.CLUESTR_SERVER = 'http://localhost:1337';

  // Create a fake HTTP server
  var frontServer = CluestrProvider.debug.createTestApiServer();
  frontServer.listen(1337);

  var token;
  before(function(done) {
    token = new CluestrProvider.debug.Token({
      cluestrToken: 'fake_access_token',
      datas: config.test_tokens,
      cursor: process.env.DROPBOX_TEST_CURSOR
    });

    token.save(done);
  });

  it("should upload datas to Cluestr", function (done) {
    var originalQueueWorker = serverConfig.queueWorker;
    serverConfig.queueWorker = function(task, cluestrClient, dropboxTokens, cb) {
      task.should.have.lengthOf(2);
      if(task[1]) {
        task[1].should.have.property('bytes');
      }

      originalQueueWorker(task, cluestrClient, dropboxTokens, cb);
    };
    var server = CluestrProvider.createServer(serverConfig);

    server.queue.drain = function() {
      done();
    };

    request(server)
      .post('/update')
      .send({
        access_token: token.cluestrToken
      })
      .expect(204)
      .end(function(err) {
        if(err) {
          throw err;
        }
      });
  });
});
