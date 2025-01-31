const axios = require('axios');
const { getConfig } = require('../config');

class WordPressService {
  constructor() {
    this.client = null;
    this.isShuttingDown = false;
  }

  setup() {
    const config = getConfig();
    const { username, password, apiUrl } = config.wordpress;

    this.client = axios.create({
      baseURL: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    // Listen for shutdown signal
    process.on('SIGTERM', () => {
      console.log('WordPress service received SIGTERM signal');
      this.isShuttingDown = true;
    });
  }

  async getComment(commentId) {
    if (!this.client) this.setup();

    try {
      const { data } = await this.client.get(`/comments/${commentId}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch comment ${commentId}:`, error.message);
      throw error;
    }
  }

  async getUnprocessedComments(batchSize) {
    if (!this.client) this.setup();

    try {
      const { data } = await this.client.get('/comments', {
        params: {
          status: 'hold',
          per_page: batchSize,
          orderby: 'date',
          order: 'asc'
        }
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch comments:', error.message);
      return [];
    }
  }

  async updateCommentStatus(commentId, status) {
    if (!this.client) this.setup();
    if (this.isShuttingDown) {
      console.log('Service is shutting down, skipping comment status update');
      return null;
    }

    try {
      const { data } = await this.client.post(`/comments/${commentId}`, { status });
      return data;
    } catch (error) {
      console.error(`Failed to update comment ${commentId}:`, error.message);
      throw error;
    }
  }

  async hasExistingResponse(parentId) {
    if (!this.client) this.setup();

    try {
      const { data } = await this.client.get('/comments', {
        params: {
          parent: parentId,
          per_page: 1
        }
      });
      return Array.isArray(data) && data.length > 0;
    } catch (error) {
      console.error(`Failed to check existing responses for comment ${parentId}:`, error.message);
      return false;
    }
  }

  async postResponse(content, postId, parentId) {
    if (!this.client) this.setup();
    if (this.isShuttingDown) {
      console.log('Service is shutting down, skipping response posting');
      return null;
    }

    try {
      // Check for existing response first
      const hasResponse = await this.hasExistingResponse(parentId);
      if (hasResponse) {
        console.log(`Comment ${parentId} already has a response, skipping`);
        return null;
      }

      // Approve the parent comment first
      await this.updateCommentStatus(parentId, 'approve');
      
      // Post the response
      const { data } = await this.client.post('/comments', {
        content,
        post: postId,
        parent: parentId,
        status: 'approve'
      });
      console.log(`Successfully posted response to comment ${parentId}`);
      return data;
    } catch (error) {
      if (this.isShuttingDown) {
        console.log('Service shutdown interrupted response posting');
        return null;
      }
      console.error('Failed to post response:', error.message);
      throw error;
    }
  }
}

module.exports = { WordPressService };