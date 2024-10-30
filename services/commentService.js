const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const { config } = require('../shared/config');

async function handleNewComment(commentData) {
  // Extraer el contenido del comentario
  const { content, id, post } = commentData;

  // Clasificar el comentario como "Correcto" o "Spam"
  const classification = await classifyComment(content.rendered);

  if (classification === 'Spam') {
    // Marcar el comentario como spam
    await markCommentAsSpam(id);
    return;
  } else if (classification === 'Correcto') {
    // Generar una respuesta que incentive la compra
    const response = await generateResponse(content.rendered);

    // Publicar la respuesta en WordPress
    await postResponse(response, post, id);
  } else {
    console.error('Clasificación desconocida:', classification);
    // Opcional: manejar casos donde la clasificación no es "Correcto" o "Spam"
  }
}

async function classifyComment(commentText) {
  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `Clasifica el siguiente comentario como "Correcto" o "Spam". Solo responde con una de esas dos opciones y nada más.

Comentario: "${commentText}"

Clasificación:`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 1,
    });

    const classification = completion.data.choices[0].message.content.trim();

    // Asegurar que la clasificación es "Correcto" o "Spam"
    if (classification === 'Correcto' || classification === 'Spam') {
      return classification;
    } else {
      console.error('Respuesta inesperada de clasificación:', classification);
      // Opcional: decidir qué hacer en este caso
      return 'Spam'; // Por defecto, marcar como Spam si la respuesta es inesperada
    }
  } catch (error) {
    console.error('Error al clasificar el comentario:', error);
    // Opcional: manejar el error, por ejemplo, marcar como Spam o reintentar
    return 'Spam';
  }
}

async function generateResponse(commentText) {
  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `El cliente ha comentado: "${commentText}". Genera una respuesta amable que lo incentive a realizar una compra en nuestra web. La respuesta debe ser en español y tener un tono amigable.`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const response = completion.data.choices[0].message.content.trim();
    return response;
  } catch (error) {
    console.error('Error al generar la respuesta:', error);
    // Opcional: manejar el error
    return '';
  }
}

async function postResponse(responseText, postId, parentId) {
  if (!responseText) {
    console.error('No se pudo generar una respuesta.');
    return;
  }

  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/wp-json/wp/v2/comments`;

  const data = {
    content: responseText,
    post: postId,
    parent: parentId,
  };

  try {
    await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al publicar la respuesta en WordPress:', error);
    // Opcional: manejar el error
  }
}

async function markCommentAsSpam(commentId) {
  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/wp-json/wp/v2/comments/${commentId}`;

  const data = {
    status: 'spam',
  };

  try {
    await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al marcar el comentario como spam:', error);
    // Opcional: manejar el error
  }
}

module.exports = {
  handleNewComment,
};
