'use strict';

var request = require('supertest');
var Anyfetch = require('anyfetch');
var AnyFetchProvider = require('anyfetch-provider');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/');



describe("Workflow", function () {

  // Create a fake HTTP server
  Anyfetch.setApiUrl('http://localhost:1337');
  Anyfetch.setManagerUrl('http://localhost:1337');

  var server = Anyfetch.createMockServer();
  server.listen(1337);

  before(AnyFetchProvider.debug.cleanTokens);
  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_dropbox_access_token',
      data: config.testTokens,
      cursor: config.testCursor,
      accountName: 'accountName'
    }, done);
  });

  it("should upload data to AnyFetch", function(done) {
    var counter = 0;

    serverConfig.config.retry = 0;
    var server = AnyFetchProvider.createServer(serverConfig.connectFunctions, __dirname + '/workers-test.js', __dirname + '/../lib/update.js', serverConfig.config);

    request(server)
      .post('/update')
      .send({
        access_token: 'fake_dropbox_access_token',
        api_url: 'http://localhost:1337',
        documents_per_update: 2500
      })
      .expect(202)
      .end(function(err) {
        if(err) {
          throw err;
        }
      });

    server.usersQueue.on('job.task.completed', function() {
      counter += 1;
    });

    server.usersQueue.on('job.task.failed', function(job, err) {
      done(err);
    });

    server.usersQueue.on('job.update.failed', function(job, err) {
      done(err);
    });

    server.usersQueue.once('empty', function() {
      counter.should.eql(4);
      done();
    });
  });
});
