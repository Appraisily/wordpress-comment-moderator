const { config } = require('../config');
const commentService = require('../services/moderator');
const axios = require('axios');

async function webhookHandler(req, res) {
  try {
    const commentData = req.body;
    await commentService.handleNewComment(commentData);
    res.status(200).send('Comment processed successfully');
  } catch (error) {
    console.error('Error processing comment:', error);
    res.status(500).send('Internal server error');
  }
}

async function batchProcessingHandler(req, res) {
  try {
    const BATCH_SIZE = req.body.batchSize || config.BATCH_SIZE;
    const comments = await commentService.getUnprocessedComments(BATCH_SIZE);

    if (!Array.isArray(comments)) {
      console.error('Comments is not an array:', comments);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ 
      message: `Processing batch of ${comments.length} comments`,
      count: comments.length,
      batchSize: BATCH_SIZE
    });

    // Process comments asynchronously after sending response
    commentService.processBatch(comments, req.protocol, req.get('host'))
      .catch(error => console.error('Batch processing error:', error));

  } catch (error) {
    console.error('Error in batch processing:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error processing comment batch' });
    }
  }
}

async function statsHandler(req, res) {
  try {
    const baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
    const response = await axios.get(`${baseUrl}/comments`, {
      params: {
        status: 'approve',
        parent: 0
      },
      auth: {
        username: config.WORDPRESS_USERNAME,
        password: config.WORDPRESS_APP_PASSWORD,
      }
    });

    const stats = {
      total: response.headers['x-wp-total'],
      totalPages: response.headers['x-wp-totalpages'],
      currentBatch: response.data.length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  webhookHandler,
  batchProcessingHandler,
  statsHandler
};