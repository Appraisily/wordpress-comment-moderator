const express = require('express');
const bodyParser = require('body-parser');
const { initializeConfig, config } = require('./shared/config');
const commentService = require('./services/commentService');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

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

initializeConfig().then(() => {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}).catch(error => {
  console.error('Error al inicializar la configuración:', error);
});
