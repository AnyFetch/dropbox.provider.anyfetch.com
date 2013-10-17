'use strict';

var request = require('supertest');
var should = require('should');
var async = require('async');

var app = require('../app.js');
var config = require('../config/configuration.js');

describe("Init APIs endpoints", function () {
  describe("GET /init/connect", function () {
    it("should redirect to Dropbox", function (done) {
      var req = request(app).get('/init/connect?code=123')
        .expect(302)
        .expect('Location', /dropbox\.com/)
        .end(done);
    });
  });
});
