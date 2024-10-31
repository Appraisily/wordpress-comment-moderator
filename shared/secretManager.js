const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

async function getSecret(name) {
  const projectId = await client.getProjectId(); // Auto-detecta el ID del proyecto
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });

  const payload = version.payload.data.toString('utf8');
  return payload;
}

module.exports = { getSecret };
