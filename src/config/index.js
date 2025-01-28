const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

let config = null;

async function setupConfig() {
  if (config) return config;

  const client = new SecretManagerServiceClient();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;

  try {
    config = {
      projectId,
      wordpress: {
        username: await getSecret(projectId, 'wp_username'),
        password: await getSecret(projectId, 'wp_app_password'),
        apiUrl: await getSecret(projectId, 'WORDPRESS_API_URL'),
      },
      ai: {
        openaiKey: await getSecret(projectId, 'OPENAI_API_KEY'),
        michelleKey: await getSecret(projectId, 'DIRECT_API_KEY'),
        michelleUsername: await getSecret(projectId, 'MICHELLE_USERNAME'),
        michellePassword: await getSecret(projectId, 'MICHELLE_APP_PASSWORD'),
      },
      security: {
        sharedSecret: await getSecret(projectId, 'SHARED_SECRET'),
      },
      settings: {
        batchSize: 50,
        delayBetweenComments: 1000,
        delayBetweenBatches: 5000,
      }
    };

    console.log('Configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
}

async function getSecret(projectId, secretName) {
  const client = new SecretManagerServiceClient();
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8').trim();
  } catch (error) {
    console.error(`Failed to retrieve secret ${secretName}:`, error);
    throw error;
  }
}

function getConfig() {
  if (!config) {
    throw new Error('Configuration not initialized');
  }
  return config;
}

module.exports = { setupConfig, getConfig };