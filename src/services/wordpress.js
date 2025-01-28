const axios = require('axios');
const { getConfig } = require('../config');

class WordPressService {
  constructor() {
    this.client = null;
  }

  setup() {
    const config = getConfig();
    const { username, password, apiUrl } = config.wordpress;

    this.client = axios.create({
      baseURL: apiUrl.replace(/\/$/, ''),
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
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

    try {
      const { data } = await this.client.post(`/comments/${commentId}`, { status });
      return data;
    } catch (error) {
      console.error(`Failed to update comment ${commentId}:`, error.message);
      throw error;
    }
  }

  async postResponse(content, postId, parentId) {
    if (!this.client) this.setup();

    try {
      await this.updateCommentStatus(parentId, 'approve');
      
      const { data } = await this.client.post('/comments', {
        content,
        post: postId,
        parent: parentId,
        status: 'approve'
      });
      return data;
    } catch (error) {
      console.error('Failed to post response:', error.message);
      throw error;
    }
  }
}

module.exports = { WordPressService };