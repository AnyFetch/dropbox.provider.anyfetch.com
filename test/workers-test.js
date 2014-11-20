'use strict';

require('should');

var workers = require('../lib/workers.js');

module.exports.addition = function(job, cb) {
  try {
    job.task.should.have.property('path');
    job.task.should.have.property('metadata');
    job.task.metadata.should.have.property('bytes');
  } catch(e) {
    return cb(e);
  }

  workers.addition(job, function(err) {
    if(err && err.toString().match(/Failure to retrieve data or empty file/i)) {
      err = null;
    }

    cb(err);
  });
};

module.exports.deletion = workers.deletion;
