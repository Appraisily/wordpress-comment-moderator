const wordpress = require('./wordpress');
const ai = require('./ai');
const axios = require('axios');

const processingComments = new Set();

async function handleNewComment(commentData) {
  const { content, id, post, author_name } = commentData;

  if (processingComments.has(id)) {
    console.log(`Comment ${id} is already being processed`);
    return;
  }

  processingComments.add(id);
  console.log(`Processing comment ID: ${id}`);
  
  try {
    const classification = await ai.classifyComment(content.rendered);
    console.log(`Comment ${id} classification: ${classification}`);

    if (classification === 'Spam') {
      await wordpress.markAsSpam(id);
      console.log(`Comment ${id} marked as spam`);
    } else {
      const response = await ai.generateMichelleResponse(content.rendered, author_name);
      if (response) {
        await wordpress.postResponse(response, post, id);
        console.log(`Response generated and posted for comment ${id}`);
      }
    }
  } catch (error) {
    console.error(`Failed to process comment ${id}:`, error);
    throw error;
  } finally {
    processingComments.delete(id);
  }
}

async function processBatch(comments, protocol, host) {
  const DELAY_BETWEEN_COMMENTS = 1000;
  const DELAY_BETWEEN_BATCHES = 5000;

  for (const comment of comments) {
    try {
      await handleNewComment(comment);
      await wordpress.markCommentAsProcessed(comment.id);
      await delay(DELAY_BETWEEN_COMMENTS);
      console.log(`Comment ${comment.id} processed successfully`);
    } catch (error) {
      console.error(`Error processing comment ${comment.id}:`, error);
      continue;
    }
  }

  if (comments.length === config.BATCH_SIZE && protocol && host) {
    await scheduleNextBatch(protocol, host, DELAY_BETWEEN_BATCHES);
  }
}

async function scheduleNextBatch(protocol, host, delay) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const response = await axios.post(
          `${protocol}://${host}/process-batch`,
          { batchSize: config.BATCH_SIZE },
          { timeout: 30000 }
        );
        console.log('Next batch started:', response.status);
        resolve();
      } catch (error) {
        console.error('Error starting next batch:', error.message);
        // Retry once after 30 seconds
        setTimeout(async () => {
          try {
            await axios.post(`${protocol}://${host}/process-batch`);
            resolve();
          } catch (retryError) {
            console.error('Retry error:', retryError.message);
            resolve();
          }
        }, 30000);
      }
    }, delay);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  handleNewComment,
  getUnprocessedComments: wordpress.getUnprocessedComments,
  processBatch
};