const axios = require('axios');
const { config } = require('../config');

class WordPressService {
  constructor() {
    this.baseUrl = null;
    this.auth = null;
  }

  initialize() {
    if (!this.baseUrl || !this.auth) {
      if (!config.WORDPRESS_API_URL || !config.MICHELLE_USERNAME || !config.MICHELLE_APP_PASSWORD) {
        throw new Error('WordPress service configuration is missing');
      }
      
      this.baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
      this.auth = Buffer.from(`${config.MICHELLE_USERNAME}:${config.MICHELLE_APP_PASSWORD}`).toString('base64');
    }
  }

  async approveComment(commentId) {
    this.initialize();
    return this.updateCommentStatus(commentId, 'approve');
  }

  async markAsSpam(commentId) {
    this.initialize();
    return this.updateCommentStatus(commentId, 'spam');
  }

  async updateCommentStatus(commentId, status) {
    this.initialize();
    try {
      const response = await axios.post(
        `${this.baseUrl}/comments/${commentId}`,
        { status },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update comment ${commentId} status to ${status}:`, error.message);
      throw error;
    }
  }

  async postResponse(responseText, postId, parentId) {
    this.initialize();
    try {
      await this.approveComment(parentId);
      
      const response = await axios.post(
        `${this.baseUrl}/comments`,
        {
          content: responseText,
          post: postId,
          parent: parentId,
          status: 'approve'
        },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to post response:', error.message);
      throw error;
    }
  }

  async getUnprocessedComments(batchSize) {
    this.initialize();
    try {
      const response = await axios.get(`${this.baseUrl}/comments`, {
        params: {
          status: 'hold',
          per_page: batchSize,
          orderby: 'date',
          order: 'asc'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`
        }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch unprocessed comments:', error.message);
      return [];
    }
  }
}

module.exports = new WordPressService();