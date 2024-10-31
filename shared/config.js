const { getSecret } = require('./secretManager');

const config = {};

// Inicialización de la configuración
async function initializeConfig() {
  try {
    config.WORDPRESS_USERNAME = (await getSecret('wp_username')).trim();
    config.WORDPRESS_APP_PASSWORD = (await getSecret('wp_app_password')).trim();
    config.WORDPRESS_API_URL = (await getSecret('WORDPRESS_API_URL')).trim();
    config.CLOUD_RUN_WEBHOOK_URL = (await getSecret('CLOUD_RUN_WEBHOOK_URL')).trim();
    config.SHARED_SECRET = (await getSecret('SHARED_SECRET')).trim();
    
    // Definir parámetros de procesamiento por lotes como constantes
    config.BATCH_SIZE = 100; // Número de comentarios por lote
    config.DELAY_BETWEEN_COMMENTS = 500; // Milisegundos de pausa entre comentarios
    config.DELAY_BETWEEN_BATCHES = 60000; // Milisegundos de pausa entre lotes (60 segundos)

    console.log('Configuración inicializada correctamente.');
  } catch (error) {
    console.error('Error inicializando la configuración:', error);
    throw error;
  }
}

module.exports = { config, initializeConfig };
