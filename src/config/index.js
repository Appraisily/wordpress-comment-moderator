const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const config = {
  BATCH_SIZE: 50,
  DELAY_BETWEEN_COMMENTS: 1000,
  DELAY_BETWEEN_BATCHES: 5000
};

async function initializeConfig() {
  try {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    config.GOOGLE_CLOUD_PROJECT_ID = projectId;

    // Core configuration
    config.WORDPRESS_USERNAME = (await getSecret(projectId, 'wp_username')).trim();
    config.WORDPRESS_APP_PASSWORD = (await getSecret(projectId, 'wp_app_password')).trim();
    config.WORDPRESS_API_URL = (await getSecret(projectId, 'WORDPRESS_API_URL')).trim();
    config.SHARED_SECRET = (await getSecret(projectId, 'SHARED_SECRET')).trim();

    // AI Services configuration
    config.OPENAI_API_KEY = (await getSecret(projectId, 'OPENAI_API_KEY')).trim();
    config.MICHELLE_API_KEY = (await getSecret(projectId, 'DIRECT_API_KEY')).trim();
    config.MICHELLE_USERNAME = (await getSecret(projectId, 'MICHELLE_USERNAME')).trim();
    config.MICHELLE_APP_PASSWORD = (await getSecret(projectId, 'MICHELLE_APP_PASSWORD')).trim();

    console.log('Configuration initialized successfully');
  } catch (error) {
    console.error('Configuration initialization failed:', error);
    throw error;
  }
}

async function getSecret(projectId, secretName) {
  const client = new SecretManagerServiceClient();
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

module.exports = { config, initializeConfig };