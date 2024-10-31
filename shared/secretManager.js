const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

async function getSecret(projectId, secretName) {
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });

    const payload = version.payload.data.toString('utf8');
    return payload;
  } catch (error) {
    console.error(`Error al obtener el secreto ${secretName}:`, error.message);
    throw error;
  }
}

module.exports = { getSecret };
