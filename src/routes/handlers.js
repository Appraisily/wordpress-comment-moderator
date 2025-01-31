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
      console.log('🔍 Debug endpoint called for comment:', req.params.commentId);
      try {
        const { wordpress, ai } = getServices();
        const commentId = req.params.commentId;
        
        console.log('📥 Fetching comment from WordPress...');
        const comment = await wordpress.getComment(commentId);
        if (!comment) {
          console.log('❌ Comment not found:', commentId);
          return res.status(404).json({ error: 'Comment not found' });
        }

        console.log('✅ Comment fetched successfully:', {
          id: comment.id,
          content: comment.content.rendered,
          author: comment.author_name,
          status: comment.status
        });

        console.log('🤖 Generating Michelle response...');
        const response = await ai.generateMichelleResponse(
          comment.content.rendered,
          comment.author_name
        );
        console.log('📤 Raw Michelle response:', response);

        let parsedResponse = null;
        try {
          if (response) {
            console.log('🔄 Attempting to parse response...');
            parsedResponse = JSON.parse(response);
            console.log('✅ Response parsed successfully');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
        }

        const debugInfo = {
          comment: {
            id: comment.id,
            content: comment.content.rendered,
            author: comment.author_name,
            status: comment.status
          },
          michelleResponse: {
            raw: response,
            parsed: parsedResponse
          }
        };

        console.log('📊 Returning debug info:', JSON.stringify(debugInfo, null, 2));
        res.json(debugInfo);
      } catch (error) {
        console.error('❌ Debug endpoint error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
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