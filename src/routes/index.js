const express = require('express');
const router = express.Router();
const { webhookHandler, batchProcessingHandler, statsHandler } = require('./handlers');
const { authenticateWebhook } = require('../middleware/auth');

// Webhook endpoint with authentication
router.post('/webhook', authenticateWebhook, webhookHandler);

// Batch processing endpoint
router.post('/process-batch', batchProcessingHandler);

// Stats endpoint
router.get('/stats', statsHandler);

module.exports = router;