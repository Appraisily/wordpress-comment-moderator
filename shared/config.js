const { getSecret } = require('./secretManager');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const config = {};

async function initializeConfig() {
  try {
    // Inicializar el cliente de Secret Manager
    const client = new SecretManagerServiceClient();
    
    // Obtener el Project ID automáticamente
    const [projectId] = await client.getProjectId();
    config.GOOGLE_CLOUD_PROJECT_ID = projectId;
    console.log('GOOGLE_CLOUD_PROJECT_ID obtenido correctamente.');

    // Obtener otros secretos utilizando el Project ID
    config.WORDPRESS_USERNAME = (await getSecret(projectId, 'wp_username')).trim();
    config.WORDPRESS_APP_PASSWORD = (await getSecret(projectId, 'wp_app_password')).trim();
    config.WORDPRESS_API_URL = (await getSecret(projectId, 'WORDPRESS_API_URL')).trim();
    console.log('Credenciales de WordPress obtenidas exitosamente.');

    config.OPENAI_API_KEY = (await getSecret(projectId, 'OPENAI_API_KEY')).trim();
    console.log('OPENAI_API_KEY obtenido exitosamente.');

    config.SHARED_SECRET = (await getSecret(projectId, 'SHARED_SECRET')).trim();
    console.log('SHARED_SECRET obtenido exitosamente.');

    // Añade otras configuraciones si es necesario
  } catch (error) {
    console.error('Error inicializando la configuración:', error);
    throw error;
  }
}

module.exports = { config, initializeConfig };
