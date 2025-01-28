const { getServices } = require('../services');
const { getConfig } = require('../config');

function createHandlers() {
  return {
    async webhook(req, res) {
      try {
        const { moderator } = getServices();
        await moderator.handleComment(req.body);
        res.status(200).send('Comment processed successfully');
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Internal server error');
      }
    },

    async processBatch(req, res) {
      try {
        const { moderator } = getServices();
        const config = getConfig();
        const batchSize = req.body.batchSize || config.settings.batchSize;
        
        const result = await moderator.processBatch(batchSize);
        res.status(200).json(result);
      } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({ error: 'Processing failed' });
      }
    },

    async stats(req, res) {
      try {
        const { wordpress } = getServices();
        const stats = await wordpress.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  };
}

module.exports = { createHandlers };