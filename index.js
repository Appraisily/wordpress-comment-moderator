const express = require('express');
const bodyParser = require('body-parser');
const { initializeConfig, config } = require('./shared/config');
const commentService = require('./services/commentService');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    const sharedSecret = req.headers['x-shared-secret'];
    if (sharedSecret !== config.SHARED_SECRET) {
      return res.status(403).send('No autorizado');
    }

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
