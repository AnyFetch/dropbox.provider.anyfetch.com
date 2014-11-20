'use strict';

var uploadFile = require('./helpers/upload.js');

module.exports.addition = function additionQueueWorker(job, cb) {
  uploadFile(job.task, job.anyfetchClient, job.serviceData, job.cache, job, cb);
};

module.exports.deletion = function deletionQueueWorker(job, cb) {
  console.log("DELETING", job.task.title);
  job.anyfetchClient.deleteDocumentByIdentifier(job.task.identifier, function(err) {
    if(err && err.toString().match(/expected 204 "No Content", got 404 "Not Found"/i)) {
      err = null;
    }

    cb(err);
  });
};
