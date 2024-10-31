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
    // Definir parámetros de procesamiento desde config
    const BATCH_SIZE = config.BATCH_SIZE; // Número de comentarios por lote
    const DELAY_BETWEEN_COMMENTS = config.DELAY_BETWEEN_COMMENTS; // Milisegundos de pausa entre comentarios
    const DELAY_BETWEEN_BATCHES = config.DELAY_BETWEEN_BATCHES; // Milisegundos de pausa entre lotes (60 segundos)

    // Obtener Comentarios No Procesados
    const comments = await commentService.getUnprocessedComments(BATCH_SIZE);

    if (comments.length === 0) {
      console.log('No hay comentarios pendientes de procesar.');
      return res.status(200).send('No hay comentarios pendientes de procesar.');
    }

    console.log(`Procesando un lote de ${comments.length} comentarios.`);

    // Procesar Cada Comentario
    for (const comment of comments) {
      await sendCommentToWebhook(comment);
      await commentService.markCommentAsProcessed(comment.id);
      await delay(DELAY_BETWEEN_COMMENTS);
    }

    console.log(`Lote de ${comments.length} comentarios procesados correctamente.`);

    // Responder al cliente
    res.status(200).send(`Lote de ${comments.length} comentarios procesados correctamente.`);

    // Opcional: Invocar el endpoint nuevamente después de un delay para procesar el siguiente lote
    setTimeout(async () => {
      try {
        await axios.post(`${req.protocol}://${req.get('host')}/process-batch`);
        console.log('Invocada la siguiente ronda de procesamiento por lotes.');
      } catch (error) {
        console.error('Error al invocar el siguiente lote de procesamiento:', error.message);
      }
    }, DELAY_BETWEEN_BATCHES);

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
      throw new Error(`Respuesta no exitosa: ${response.status} - ${JSON.stringify(response.data)}`);
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
