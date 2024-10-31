const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Obtener el ID del proyecto desde las variables de entorno
const projectId = process.env.GOOGLE_CLOUD_PROJECT;

if (!projectId) {
  throw new Error('La variable de entorno GOOGLE_CLOUD_PROJECT no está definida.');
}

// Inicializa el cliente de Secret Manager
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });

  const payload = version.payload.data.toString('utf8');
  return payload;
}

module.exports = { getSecret };
