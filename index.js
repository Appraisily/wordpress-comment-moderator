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
    const DELAY_BETWEEN_BATCHES = config.DELAY_BETWEEN_BATCHES; // Milisegundos de pausa entre lotes

    // Obtener Comentarios No Procesados
    const comments = await commentService.getUnprocessedComments(BATCH_SIZE);

    if (!Array.isArray(comments)) {
      console.error('La variable comments no es un arreglo:', comments);
      return res.status(500).send('Error interno del servidor.');
    }

    if (comments.length === 0) {
      console.log('No hay comentarios pendientes de procesar.');
      return res.status(200).send('No hay comentarios pendientes de procesar.');
    }

    console.log(`Procesando un lote de ${comments.length} comentarios.`);

    // Procesar Cada Comentario
    for (const comment of comments) {
      await commentService.handleNewComment(comment);
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

// Función de Utilidad para Pausas
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Añadir después de la definición de las rutas pero antes de initializeConfig
const DAILY_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

async function processPendingComments() {
  try {
    console.log('Iniciando procesamiento automático de comentarios...');
    const BATCH_SIZE = config.BATCH_SIZE;
    const DELAY_BETWEEN_COMMENTS = config.DELAY_BETWEEN_COMMENTS;
    
    const comments = await commentService.getUnprocessedComments(BATCH_SIZE);
    
    if (comments.length === 0) {
      console.log('No hay comentarios pendientes de procesar.');
      return;
    }

    console.log(`Procesando ${comments.length} comentarios pendientes.`);
    
    for (const comment of comments) {
      await commentService.handleNewComment(comment);
      await commentService.markCommentAsProcessed(comment.id);
      await delay(DELAY_BETWEEN_COMMENTS);
    }
    
    console.log('Procesamiento automático completado.');
  } catch (error) {
    console.error('Error en el procesamiento automático:', error);
  }
}

initializeConfig().then(() => {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    
    // Iniciar el primer procesamiento después de 1 minuto
    setTimeout(() => {
      processPendingComments();
      // Configurar el intervalo diario
      setInterval(processPendingComments, DAILY_INTERVAL);
    }, 60000);
  });
}).catch(error => {
  console.error('Error al inicializar la configuración:', error);
});
