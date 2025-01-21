// New file to handle comment moderation logic
const wordpress = require('./wordpress');
const ai = require('./ai');

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

module.exports = {
  handleNewComment,
  getUnprocessedComments: wordpress.getUnprocessedComments,
};