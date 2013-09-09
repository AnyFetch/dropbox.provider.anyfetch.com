'use strict';
/**
 * @file Define everything that need to be exported for use with the server.
 *
 * This object contains everything that need to be exported (for test or production purposes) : handlers, models and middleware.
 */

module.exports = {
  handlers: {
    init: require('./handlers/init.js'),
    update: require('./handlers/update.js'),
  },
  models: {
    Token: require('./models/token.js'),
    TempToken: require('./models/temp-token.js')
  },
  helpers: {
    retrieve: require('./helpers/retrieve.js'),
    upload: require('./helpers/upload.js')
  }
};
