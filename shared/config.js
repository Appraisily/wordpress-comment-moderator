const { getSecret } = require('./secretManager');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const config = {};

// Inicialización de la configuración
async function initializeConfig() {
  try {
    // Inicializar el cliente de Secret Manager
    const client = new SecretManagerServiceClient();
    
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
config.GOOGLE_CLOUD_PROJECT_ID = projectId;
console.log('GOOGLE_CLOUD_PROJECT_ID obtenido correctamente:', projectId);


    // Obtener otros secretos utilizando el Project ID
    config.WORDPRESS_USERNAME = (await getSecret(projectId, 'wp_username')).trim();
    config.WORDPRESS_APP_PASSWORD = (await getSecret(projectId, 'wp_app_password')).trim();
    config.WORDPRESS_API_URL = (await getSecret(projectId, 'WORDPRESS_API_URL')).trim();
    console.log('Credenciales de WordPress obtenidas exitosamente.');

    config.OPENAI_API_KEY = (await getSecret(projectId, 'OPENAI_API_KEY')).trim();
    console.log('OPENAI_API_KEY obtenido exitosamente.');

    config.SHARED_SECRET = (await getSecret(projectId, 'SHARED_SECRET')).trim();
    console.log('SHARED_SECRET obtenido exitosamente.');

    config.MICHELLE_API_KEY = (await getSecret(projectId, 'DIRECT_API_KEY')).trim();
    console.log('MICHELLE_API_KEY obtenido exitosamente.');

    // Definir CLOUD_RUN_WEBHOOK_URL directamente en el código
    config.CLOUD_RUN_WEBHOOK_URL = 'https://tu-cloud-run-service-url/webhook'; // Reemplaza con tu URL real
    console.log('CLOUD_RUN_WEBHOOK_URL definido directamente en el código.');

    // Definir parámetros de procesamiento por lotes como constantes
    config.BATCH_SIZE = 50; // Aumentado significativamente
    config.DELAY_BETWEEN_COMMENTS = 1000; // 1 segundo entre comentarios
    config.DELAY_BETWEEN_BATCHES = 5000; // 5 segundos entre lotes

    console.log('Configuración inicializada correctamente.');
  } catch (error) {
    console.error('Error inicializando la configuración:', error);
    throw error;
  }
}

module.exports = { config, initializeConfig };
