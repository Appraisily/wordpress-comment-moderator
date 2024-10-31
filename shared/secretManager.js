const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { config } = require('./config'); // Asegúrate de que la ruta es correcta

const client = new SecretManagerServiceClient();

async function getSecret(name) {
  const projectId = config.GOOGLE_CLOUD_PROJECT_ID;
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });

  const payload = version.payload.data.toString('utf8');
  return payload;
}

module.exports = { getSecret };
