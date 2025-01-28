const { getConfig } = require('../config');

class ModeratorService {
  constructor(wordpressService, aiService) {
    this.wordpress = wordpressService;
    this.ai = aiService;
    this.processingComments = new Set();
  }

  async handleComment(commentData) {
    const { content, id, post, author_name } = commentData;

    if (this.processingComments.has(id)) {
      console.log(`Comment ${id} is already being processed`);
      return;
    }

    this.processingComments.add(id);
    console.log(`Processing comment ID: ${id}`);
    
    try {
      const classification = await this.ai.classifyComment(content.rendered);
      console.log(`Comment ${id} classification: ${classification}`);

      if (classification === 'Spam') {
        await this.wordpress.updateCommentStatus(id, 'spam');
        console.log(`Comment ${id} marked as spam`);
      } else {
        const response = await this.ai.generateMichelleResponse(content.rendered, author_name);
        if (response) {
          await this.wordpress.postResponse(response, post, id);
          console.log(`Response generated and posted for comment ${id}`);
        }
      }
    } catch (error) {
      console.error(`Failed to process comment ${id}:`, error);
      throw error;
    } finally {
      this.processingComments.delete(id);
    }
  }

  async processBatch(batchSize) {
    const comments = await this.wordpress.getUnprocessedComments(batchSize);
    
    if (!comments.length) {
      return { message: 'No comments to process', count: 0 };
    }

    for (const comment of comments) {
      try {
        await this.handleComment(comment);
        await this.delay(getConfig().settings.delayBetweenComments);
      } catch (error) {
        console.error(`Error processing comment ${comment.id}:`, error);
        continue;
      }
    }

    return {
      message: `Processed batch of ${comments.length} comments`,
      count: comments.length,
      batchSize
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ModeratorService };