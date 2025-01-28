const { Router } = require('express');
const { authenticateWebhook } = require('../middleware/auth');
const { createHandlers } = require('./handlers');

function setupRoutes(app) {
  const router = Router();
  const handlers = createHandlers();

  router.post('/webhook', authenticateWebhook, handlers.webhook);
  router.post('/process-batch', handlers.processBatch);
  router.get('/stats', handlers.stats);

  app.use('/', router);
}

module.exports = { setupRoutes };