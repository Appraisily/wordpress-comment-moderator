const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { initializeConfig } = require('./config');
const { startPeriodicProcessing } = require('./services/scheduler');

async function createApp() {
  // Initialize configuration first
  await initializeConfig();

  // Create Express app
  const app = express();
  
  // Middleware
  app.use(bodyParser.json());
  
  // Routes
  app.use('/', routes);

  return app;
}

module.exports = { createApp };