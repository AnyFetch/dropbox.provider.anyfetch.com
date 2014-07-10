/**
 * @file Defines the provider settings.
 *
 * Will set the path to Mongo, and applications id
 * Most of the configuration can be done using system environment variables.
 */

// Load environment variables from .env file
var dotenv = require('dotenv');
dotenv.load();

// node_env can either be "development" or "production"
var node_env = process.env.NODE_ENV || "development";

// Port to run the app on. 8000 for development
// (Vagrant syncs this port)
// 80 for production
var default_port = 8000;
if(node_env === "production") {
  default_port = 80;
}

// Exports configuration for use by app.js
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,
  maxSize: process.env.MAX_SIZE || 50,

  mongoUrl: process.env.MONGOLAB_URI,
  redisUrl: process.env.REDISCLOUD_URL,

  dropboxId: process.env.DROPBOX_ID,
  dropboxSecret: process.env.DROPBOX_SECRET,

  providerUrl: process.env.PROVIDER_URL,

  appId: process.env.DROPBOX_ANYFETCH_ID,
  appSecret: process.env.DROPBOX_ANYFETCH_SECRET,

  maxConcurrency: process.env.DROPBOX_MAX_CONCURRENCY || 5,

  testTokens: {
    oauth_token_secret: process.env.DROPBOX_TEST_OAUTH_TOKEN_SECRET,
    oauth_token: process.env.DROPBOX_TEST_OAUTH_TOKEN,
    uid: process.env.DROPBOX_TEST_UID,
  },
  testImagePath: process.env.DROPBOX_TEST_IMAGE_PATH, // Path to an image in the dropbox test account
  testCursor: process.env.DROPBOX_TEST_CURSOR
};
