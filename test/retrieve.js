'use strict';

require('should');

var config = require('../config/configuration.js');
var retrieve = require('../lib/provider-dropbox/helpers/retrieve');

describe("Retrieve helper", function () {
  it("should list files modified since last run", function (done) {
    var cursor = "AAGeRFfkuYVnZQpnJfuCctDhjCMEfSSQwZ8DWFTRKZ9OA1gU0wRu1bnkxV4SHF8KNbbg5_CKoZ91RfOhzgf0AaRM4kzsGifEuP-og7c8pMowPsrGYQJ2Glj7m2dcOdztfi_1KSKjA0XYnEpyiublB0cSAkYIBqgZKbej7btv_jqdeTmuvh3w8OwgC0OkiOJx0TEutN4Gnkoxs51LdrCijaHOrZ1va5M6wdOzyfQa0-9HtsT4Xkvn_d3wVRuynTtALVE";

    retrieve.delta(config.test_tokens, cursor, function(err, files) {
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

  it("should retrieve a file", function (done) {
    var datas = "";
    var stream = retrieve.streamFile(config.test_tokens, '/AndroidManifest.xml');

    stream.on("data", function(chunk) {
      datas += chunk;
    });

    stream.on("end", function() {
      datas.length.should.equal(923);
      done();
    });
  });
});
