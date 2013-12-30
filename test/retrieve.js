'use strict';

require('should');

var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve');

describe("Retrieve helper", function () {
  it("should list files modified since last run", function (done) {
    retrieve.delta(config.test_tokens, config.test_cursor, function(err, files) {
      if(err) {
        throw err;
      }

      files.length.should.be.above(0);
      files[0].should.have.lengthOf(2);

      var datas = files[0][1];

      datas.should.have.property('bytes');
      datas.should.have.property('path');

      done();
    });
  });
});
