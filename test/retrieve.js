'use strict';

var should = require('should');

var config = require('../config/configuration.js');
var providerDropbox = require('../lib/provider-dropbox');
var retrieve = providerDropbox.helpers.retrieve;

describe("Retrieve code", function () {
  it("should list files modified since", function (done) {
    var cursor = "AAGeRFfkuYVnZQpnJfuCctDhjCMEfSSQwZ8DWFTRKZ9OA1gU0wRu1bnkxV4SHF8KNbbg5_CKoZ91RfOhzgf0AaRM4kzsGifEuP-og7c8pMowPsrGYQJ2Glj7m2dcOdztfi_1KSKjA0XYnEpyiublB0cSAkYIBqgZKbej7btv_jqdeTmuvh3w8OwgC0OkiOJx0TEutN4Gnkoxs51LdrCijaHOrZ1va5M6wdOzyfQa0-9HtsT4Xkvn_d3wVRuynTtALVE";

    retrieve.delta(config.test_refresh_token, cursor, function(err, files) {
      if(err) {
        throw err;
      }

      should.exist(files.files[0]);
      should.exist(files.deletedFiles[0]);
      should.exist(files.cursor);
      done();
    });
  });

  it("should retrieve a file", function (done) {
    retrieve.file(config.test_refresh_token, '/AndroidManifest.xml', function(err, file) {
      if(err) {
        throw err;
      }

      file.toString().length.should.be.above(15);
      done();
    });
  });
});
