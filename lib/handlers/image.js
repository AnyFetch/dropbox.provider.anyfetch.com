'use strict';


module.exports.get = function(req, res, next) {
  res.send(200, "OK");
  next();
};
