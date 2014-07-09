'use strict';

require('should');

var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve');

describe("Retrieve helper", function () {
  it("should list files modified since last run", function (done) {
    retrieve.delta(config.testTokens, config.testCursor, function(err, files) {
      if(err) {
        throw err;
      }

      files.length.should.be.above(0);
      files[0].should.have.lengthOf(2);

      var data = files[0][1];

      data.should.have.property('bytes');
      data.should.have.property('path');

      done();
    });
  });
});
