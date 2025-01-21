// Rename from shared/secretManager.js to src/config/secretManager.js
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

async function getSecret(projectId, secretName) {
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
  } catch (error) {
    console.error(`Failed to retrieve secret ${secretName}:`, error.message);
    throw error;
  }
}

module.exports = { getSecret };