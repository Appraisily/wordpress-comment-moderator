const commentService = require('./moderator');
const { config } = require('../config');

const HOURLY_INTERVAL = 60 * 60 * 1000;
const INITIAL_DELAY = 60000;

async function processPendingComments() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 Starting automatic comment processing (Hourly Cron Job)`);
    
    const comments = await commentService.getUnprocessedComments(config.BATCH_SIZE);
    
    if (comments.length === 0) {
      console.log(`[${timestamp}] ✅ No pending comments to process`);
      return;
    }

    console.log(`[${timestamp}] 📝 Processing batch of ${comments.length} pending comments`);
    await commentService.processBatch(comments);
    console.log(`[${timestamp}] ✨ Automatic processing completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error in automatic processing:`, error);
  }
}

function startPeriodicProcessing() {
  setTimeout(() => {
    processPendingComments();
    setInterval(processPendingComments, HOURLY_INTERVAL);
  }, INITIAL_DELAY);
}

module.exports = {
  startPeriodicProcessing
};