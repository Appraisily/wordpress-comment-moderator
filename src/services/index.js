const { WordPressService } = require('./wordpress');
const { AIService } = require('./ai');
const { ModeratorService } = require('./moderator');

let services = null;

async function setupServices() {
  if (services) return services;

  const wordpress = new WordPressService();
  const ai = new AIService();
  const moderator = new ModeratorService(wordpress, ai);

  services = {
    wordpress,
    ai,
    moderator
  };

  return services;
}

function getServices() {
  if (!services) {
    throw new Error('Services not initialized');
  }
  return services;
}

module.exports = {
  setupServices,
  getServices
};