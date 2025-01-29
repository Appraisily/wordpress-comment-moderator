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
    },

    async debugMichelle(req, res) {
      try {
        const { wordpress, ai } = getServices();
        const commentId = req.params.commentId;
        
        // Get the comment from WordPress
        const comment = await wordpress.getComment(commentId);
        if (!comment) {
          return res.status(404).json({ error: 'Comment not found' });
        }

        // Debug info about the comment
        console.log('Debug - Comment data:', {
          id: comment.id,
          content: comment.content.rendered,
          author: comment.author_name
        });

        // Try to generate Michelle's response
        const response = await ai.generateMichelleResponse(
          comment.content.rendered,
          comment.author_name
        );

        // Return full debug information
        res.json({
          comment: {
            id: comment.id,
            content: comment.content.rendered,
            author: comment.author_name
          },
          michelleResponse: {
            raw: response,
            parsed: response ? JSON.parse(response) : null
          }
        });
      } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
          error: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }
  };
}

module.exports = { createHandlers };