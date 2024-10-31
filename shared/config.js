const { getSecret } = require('./secretManager');

const config = {};

async function initializeConfig() {
  try {
    // Obtener el project ID primero
    config.GOOGLE_CLOUD_PROJECT_ID = (await getSecret('GOOGLE_CLOUD_PROJECT_ID')).trim();
    console.log('GOOGLE_CLOUD_PROJECT_ID obtenido exitosamente.');

    // Luego, obtener otros secretos utilizando el project ID
    config.WORDPRESS_USERNAME = (await getSecret('wp_username')).trim();
    config.WORDPRESS_APP_PASSWORD = (await getSecret('wp_app_password')).trim();
    config.WORDPRESS_API_URL = (await getSecret('WORDPRESS_API_URL')).trim();
    console.log('Credenciales de WordPress obtenidas exitosamente.');

    config.OPENAI_API_KEY = (await getSecret('OPENAI_API_KEY')).trim();
    console.log('OPENAI_API_KEY obtenido exitosamente.');

    config.SHARED_SECRET = (await getSecret('SHARED_SECRET')).trim();
    console.log('SHARED_SECRET obtenido exitosamente.');

    // Añade otras configuraciones si es necesario
  } catch (error) {
    console.error('Error inicializando la configuración:', error);
    throw error;
  }
}

module.exports = { config, initializeConfig };
