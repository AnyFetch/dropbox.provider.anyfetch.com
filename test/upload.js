'use strict';

var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
var Anyfetch = require('anyfetch');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/');



describe("Workflow", function () {

  // Create a fake HTTP server
  Anyfetch.setApiUrl('http://localhost:8000');
  Anyfetch.setManagerUrl('http://localhost:8000');
  var server = Anyfetch.createMockServer();
  server.listen(1337);

  before(AnyFetchProvider.debug.cleanTokens);
  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_dropbox_access_token',
      data: config.testTokens,
      cursor: config.testCursor
    }, done);
  });

  it("should upload data to AnyFetch", function (done) {
    var originalQueueWorker = serverConfig.workers.addition;
    var counter = 0;
    serverConfig.workers.addition = function(job, cb) {
      job.task.should.have.property('path');
      job.task.should.have.property('metadata');
      job.task.metadata.should.have.property('bytes');

      originalQueueWorker(job, function(err) {
        if(err) {
          cb(err);
        }

        counter += 1;
        if(counter === 3) {
          return done();
        }
      });
    };
    var server = AnyFetchProvider.createServer(serverConfig.connectFunctions, serverConfig.updateAccount, serverConfig.workers, serverConfig.config);

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
