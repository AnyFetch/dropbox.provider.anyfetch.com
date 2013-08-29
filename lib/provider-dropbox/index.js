'use strict';
/**
 * @file Define everything that need to be exported for use with the server.
 *
 * This object contains everything that need to be exported (for test or production purposes) : handlers, models and middleware.
 */

module.exports = {
  handlers: {
    init: require('./handlers/init.js'),
  },
  models: {
    Token: require('./models/token.js')
  },
  helpers: {
    retrieve: require('./helpers/retrieve.js'),
    mapper: require('./helpers/mapper.js'),
    upload: require('./helpers/upload.js')
  }
};
