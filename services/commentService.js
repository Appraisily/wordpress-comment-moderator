const axios = require('axios');
const openai = require('openai');
const { config } = require('../shared/config');
const { generateMichelleResponse } = require('./michelleService');

// Set para trackear comentarios en proceso
const processingComments = new Set();

// Manejar un nuevo comentario
async function handleNewComment(commentData) {
  const { content, id, post, author_name } = commentData;

  if (processingComments.has(id)) {
    console.log(`Comentario ${id} ya está siendo procesado.`);
    return;
  }

  processingComments.add(id);
  console.log(`Procesando comentario ID: ${id}`);
  
  try {
    const classification = await classifyComment(content.rendered);
    console.log(`Clasificación del comentario ID ${id}: ${classification}`);

    if (classification === 'Spam') {
      await markCommentAsSpam(id);
      console.log(`Comentario ID ${id} marcado como spam.`);
    } else if (classification === 'Correcto') {
      const response = await generateMichelleResponse(content.rendered, author_name);
      if (response) {
        await postResponse(response, post, id);
        console.log(`Respuesta generada y publicada para comentario ID ${id}.`);
      }
    }
  } catch (error) {
    console.error(`Error procesando comentario ${id}:`, error);
    throw error;
  } finally {
    processingComments.delete(id);
  }
}

// Clasificar el comentario usando OpenAI
async function classifyComment(commentText) {
  const configuration = new openai.Configuration({
    apiKey: config.OPENAI_API_KEY,
  });
  const openaiApi = new openai.OpenAIApi(configuration);

  const prompt = `Clasifica el siguiente comentario como "Correcto" o "Spam". Solo responde con una de esas dos opciones y nada más.

Comentario: "${commentText}"

Clasificación:`;

  try {
    const completion = await openaiApi.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 6,
    });

    const classification = completion.data.choices[0].message.content.trim();

    if (classification === 'Correcto' || classification === 'Spam') {
      return classification;
    } else {
      console.error(`Respuesta inesperada de clasificación: "${classification}"`);
      return 'Spam';
    }
  } catch (error) {
    console.error('Error al clasificar el comentario:', error.response ? error.response.data : error.message);
    return 'Spam';
  }
}

// Publicar la respuesta en WordPress
async function postResponse(responseText, postId, parentId) {
  if (!responseText) {
    console.error('No se pudo generar una respuesta.');
    return;
  }

  const baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
  const auth = Buffer.from(`${config.MICHELLE_USERNAME}:${config.MICHELLE_APP_PASSWORD}`).toString('base64');
  
  try {
    // Primero, aprobar el comentario original
    await axios.post(`${baseUrl}/comments/${parentId}`, 
      { status: 'approve' },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Comentario original ${parentId} aprobado`);

    // Luego, publicar la respuesta
    const apiUrl = `${baseUrl}/comments`;
    const data = {
      content: responseText,
      post: postId,
      parent: parentId,
      status: 'approve'
    };

    const response = await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Respuesta publicada exitosamente en el comentario ID ${parentId}`);
    return response.data;
  } catch (error) {
    console.error('Error al publicar la respuesta:', error.response?.data || error.message);
    throw error;
  }
}

// Marcar el comentario como spam en WordPress
async function markCommentAsSpam(commentId) {
  const baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/comments/${commentId}`;
  const auth = Buffer.from(`${config.MICHELLE_USERNAME}:${config.MICHELLE_APP_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(apiUrl, 
      { status: 'spam' },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Comentario ${commentId} marcado como spam. Estado: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`Error al marcar comentario ${commentId} como spam:`, error.response?.data || error.message);
    throw error;
  }
}

// Obtener comentarios no procesados para procesamiento por lotes
async function getUnprocessedComments(batchSize) {
  try {
    const baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/comments`;
    const auth = Buffer.from(`${config.MICHELLE_USERNAME}:${config.MICHELLE_APP_PASSWORD}`).toString('base64');

    const response = await axios.get(apiUrl, {
      params: {
        status: 'hold',
        per_page: batchSize,
        orderby: 'date',
        order: 'asc'
      },
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (Array.isArray(response.data)) {
      console.log(`Obtenidos ${response.data.length} comentarios pendientes de moderación`);
      return response.data;
    } else {
      console.error('Formato de respuesta inesperado:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error al obtener comentarios:', error.message);
    return [];
  }
}

// Marcar un comentario como procesado en WordPress
async function markCommentAsProcessed(commentId) {
  const baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/comments/${commentId}`;
  const auth = Buffer.from(`${config.MICHELLE_USERNAME}:${config.MICHELLE_APP_PASSWORD}`).toString('base64');

  console.log(`URL para marcar comentario como procesado: ${apiUrl}`);

  const data = {
    meta: {
      processed: true,
    },
  };

  try {
    const response = await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
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