const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const { config } = require('../shared/config');
const crypto = require('crypto');

// Manejar un nuevo comentario
async function handleNewComment(commentData) {
  const { content, id, post } = commentData;

  console.log(`Procesando comentario ID: ${id} en el post ID: ${post}`);

  const classification = await classifyComment(content.rendered);

  console.log(`Clasificación del comentario ID ${id}: ${classification}`);

  if (classification === 'Spam') {
    await markCommentAsSpam(id);
    console.log(`Comentario ID ${id} marcado como spam.`);
    return;
  } else if (classification === 'Correcto') {
    const response = await generateResponse(content.rendered);

    if (response) {
      await postResponse(response, post, id);
      console.log(`Respuesta generada y publicada para comentario ID ${id}.`);
    } else {
      console.error(`No se pudo generar una respuesta para el comentario ID ${id}.`);
    }
  } else {
    console.error(`Clasificación desconocida para el comentario ID ${id}: ${classification}`);
  }
}

// Clasificar el comentario usando OpenAI
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
      max_tokens: 6, // Aumentado para evitar truncamiento
    });

    const classification = completion.data.choices[0].message.content.trim();

    if (classification === 'Correcto' || classification === 'Spam') {
      return classification;
    } else {
      console.error(`Respuesta inesperada de clasificación: "${classification}"`);
      return 'Spam'; // Por defecto, marcar como Spam si la respuesta es inesperada
    }
  } catch (error) {
    console.error('Error al clasificar el comentario:', error);
    return 'Spam'; // Marcar como Spam en caso de error
  }
}

// Generar una respuesta para el comentario usando OpenAI
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
    return '';
  }
}

// Publicar la respuesta en WordPress
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
    const response = await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Respuesta publicada exitosamente en el comentario ID ${parentId}. Código de estado: ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.error(`Error al publicar la respuesta en WordPress. Código de estado: ${error.response.status}. Mensaje: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('Error al publicar la respuesta en WordPress:', error.message);
    }
  }
}

// Marcar el comentario como spam en WordPress
async function markCommentAsSpam(commentId) {
  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/wp-json/wp/v2/comments/${commentId}`;

  const data = {
    status: 'spam',
  };

  try {
    const response = await axios.put(apiUrl, data, { // Usar PUT es más claro para actualizaciones
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Comentario ID ${commentId} marcado como spam exitosamente. Código de estado: ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.error(`Error al marcar el comentario como spam. Código de estado: ${error.response.status}. Mensaje: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('Error al marcar el comentario como spam:', error.message);
    }
  }
}

// Obtener comentarios no procesados para procesamiento por lotes
async function getUnprocessedComments(batchSize) {
  try {
    const response = await axios.get(config.WORDPRESS_API_URL, {
      params: {
        status: 'approve',
        per_page: batchSize,
        // Si tienes un campo personalizado para marcar procesados, puedes agregar filtros aquí
        // Por ejemplo: meta_key=processed&meta_value=false
      },
      auth: {
        username: config.WORDPRESS_USERNAME,
        password: config.WORDPRESS_APP_PASSWORD,
      },
      timeout: 10000, // Tiempo máximo de espera por respuesta
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener comentarios no procesados:', error.message);
    return [];
  }
}

// Marcar un comentario como procesado en WordPress
async function markCommentAsProcessed(commentId) {
  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/${commentId}`;

  const data = {
    meta: {
      processed: true, // Asegúrate de que tu WordPress soporte metadatos personalizados para comentarios
    },
  };

  try {
    const response = await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    console.log(`Comentario ID ${commentId} marcado como procesado exitosamente. Código de estado: ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.error(`Error al marcar el comentario ${commentId} como procesado. Código de estado: ${error.response.status}. Mensaje: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Error al marcar el comentario ${commentId} como procesado:`, error.message);
    }
  }
}

module.exports = {
  handleNewComment,
  getUnprocessedComments,
  markCommentAsProcessed,
};
