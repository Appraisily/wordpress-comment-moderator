const express = require('express');
const bodyParser = require('body-parser');
const { initializeConfig, config } = require('./shared/config');
const commentService = require('./services/commentService');
const crypto = require('crypto');
const axios = require('axios'); // Asegúrate de tener axios instalado
const app = express();
app.use(bodyParser.json());

// Endpoint existente para el webhook
app.post('/webhook', async (req, res) => {
  try {
    const incomingSecret = req.headers['x-shared-secret'];

    if (!incomingSecret || !config.SHARED_SECRET) {
      console.warn('No se proporcionó el Shared Secret.');
      return res.status(403).send('No autorizado');
    }

    const incomingSecretBuffer = Buffer.from(incomingSecret);
    const storedSecretBuffer = Buffer.from(config.SHARED_SECRET);

    if (incomingSecretBuffer.length !== storedSecretBuffer.length) {
      console.warn('Longitud del Shared Secret no coincide.');
      return res.status(403).send('No autorizado');
    }

    if (!crypto.timingSafeEqual(incomingSecretBuffer, storedSecretBuffer)) {
      console.warn('Shared Secret inválido.');
      return res.status(403).send('No autorizado');
    }

    console.log('Shared Secret verificado correctamente.');

    const commentData = req.body;
    await commentService.handleNewComment(commentData);
    res.status(200).send('Comentario procesado.');
  } catch (error) {
    console.error('Error al procesar el comentario:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Nuevo Endpoint para Procesamiento por Lotes
app.post('/process-batch', async (req, res) => {
  try {
    // Autenticación Básica para el Endpoint (Opcional pero Recomendado)
    const authHeader = req.headers['authorization'];
    const expectedToken = config.BATCH_PROCESS_TOKEN; // Define este token en tu configuración

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Acceso no autorizado al endpoint de procesamiento por lotes.');
      return res.status(403).send('No autorizado');
    }

    // Parámetros de Búsqueda
    const BATCH_SIZE = config.BATCH_SIZE || 100; // Tamaño del lote
    const DELAY_BETWEEN_COMMENTS = config.DELAY_BETWEEN_COMMENTS || 500; // Milisegundos
    const DELAY_BETWEEN_BATCHES = config.DELAY_BETWEEN_BATCHES || 60000; // Milisegundos (1 minuto)

    // Obtener Comentarios No Procesados
    const comments = await commentService.getUnprocessedComments(BATCH_SIZE);

    if (comments.length === 0) {
      logging.info('No hay comentarios pendientes de procesar.');
      return res.status(200).send('No hay comentarios pendientes de procesar.');
    }

    // Procesar Cada Comentario
    for (const comment of comments) {
      await sendCommentToWebhook(comment);
      await commentService.markCommentAsProcessed(comment.id);
      await delay(DELAY_BETWEEN_COMMENTS);
    }

    logging.info(`Procesado un lote de ${comments.length} comentarios.`);

    // Esperar antes de permitir el siguiente lote
    setTimeout(() => {
      logging.info('Lote procesado. Puedes invocar el endpoint nuevamente para el siguiente lote.');
    }, DELAY_BETWEEN_BATCHES);

    res.status(200).send(`Procesado un lote de ${comments.length} comentarios.`);
  } catch (error) {
    console.error('Error al procesar el lote de comentarios:', error);
    res.status(500).send('Error interno del servidor.');
  }
});

// Función para Enviar Comentario al Webhook
async function sendCommentToWebhook(comment) {
  try {
    const response = await axios.post(config.CLOUD_RUN_WEBHOOK_URL, comment, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shared-Secret': config.SHARED_SECRET
      },
      timeout: 5000 // Tiempo máximo de espera por respuesta
    });

    if (response.status !== 200) {
      throw new Error(`Respuesta no exitosa: ${response.status} - ${response.data}`);
    }

    console.log(`Comentario ${comment.id} procesado correctamente.`);
  } catch (error) {
    console.error(`Error al enviar el comentario ${comment.id} al webhook:`, error.message);
    // Opcional: Implementar lógica de reintentos o registro para comentarios fallidos
  }
}

// Función de Utilidad para Pausas
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

initializeConfig().then(() => {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}).catch(error => {
  console.error('Error al inicializar la configuración:', error);
});
