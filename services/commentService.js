const axios = require('axios');
const openai = require('openai');
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
  const configuration = new openai.Configuration({
    apiKey: config.OPENAI_API_KEY,
  });
  const openaiApi = new openai.OpenAIApi(configuration);

  const prompt = `Clasifica el siguiente comentario como "Correcto" o "Spam". Solo responde con una de esas dos opciones y nada más.

Comentario: "${commentText}"

Clasificación:`;

  try {
    const completion = await openaiApi.createChatCompletion({
      model: 'gpt-3.5-turbo', // Cambia a 'gpt-4' si tienes acceso
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
    console.error('Error al clasificar el comentario:', error.response ? error.response.data : error.message);
    return 'Spam'; // Marcar como Spam en caso de error
  }
}

// Generar una respuesta para el comentario usando OpenAI
async function generateResponse(commentText) {
  const configuration = new openai.Configuration({
    apiKey: config.OPENAI_API_KEY,
  });
  const openaiApi = new openai.OpenAIApi(configuration);

  const prompt = `The customer has commented: "${commentText}". Generate a friendly response that encourages them to make a purchase on our website. The response should be in Spanish, with a warm and engaging tone.

Use the following information as a basis for the response:

- Highlight our expertise in art and antique appraisal, including the use of specialized knowledge and modern technology for accurate, precise appraisals.
- Mention our track record of serving over 10,000 clients with professionalism and reliability.
- Emphasize that our reports adhere to USPAP standards, ensuring high quality and fair valuation.
- Encourage the customer to try our services, for example, by visiting (https://landing.appraisily.com/) or (https://services.appraisily.com/) to begin their appraisal service. Alternatively, invite them to test the "Free Instant Art Screening" through (https://screener.appraisily.com/).
- Use key selling points of our services, such as insurance and tax deduction appraisals, fast 24-48 hour turnaround, and transparent pricing starting from just $59.

Be sure to incorporate points into a warm, engaging, and friendly suggestion that directly addresses the customer's potential needs.

# Output Format
The output should be a brief yet friendly paragraph in Spanish where:
- The customer comment is acknowledged.
- The value of the services is highlighted.
- The customer is encouraged to either initiate an appraisal, explore tailored services, or try our free analysis.

# Example
Input:
The customer has commented: "I am considering getting an appraisal for some artwork, but I'm not sure yet."

Response:
"¡Es emocionante saber que estás considerando tasar tus obras de arte! En Appraisily, contamos con más de 10,000 clientes satisfechos gracias a nuestra experiencia y tecnología avanzada para brindar tasaciones precisas y confiables siguiendo los estándares USPAP. Te invitamos a iniciar tu servicio de tasación visitando (https://landing.appraisily.com/) o (https://services.appraisily.com/). Si lo prefieres, puedes probar nuestro "Análisis Instantáneo de Arte Gratuito" en (https://screener.appraisily.com/). ¡Estamos aquí para ayudarte a descubrir el verdadero valor de tus tesoros!"

# Notes
- Remember to keep the tone positive and welcoming.
- Highlight different options available to the customer so they feel in control of their journey.
- Adapt the response to the specific customer comment to maximize relevance and engagement.
`;

  try {
    const completion = await openaiApi.createChatCompletion({
      model: 'gpt-3.5-turbo', // Cambia a 'gpt-4' si tienes acceso
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const response = completion.data.choices[0].message.content.trim();
    return response;
  } catch (error) {
    console.error('Error al generar la respuesta:', error.response ? error.response.data : error.message);
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
    const response = await axios.put(apiUrl, data, {
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
    const baseUrl = config.WORDPRESS_API_URL.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/wp-json/wp/v2/comments`;

    console.log('Solicitando comentarios desde URL:', apiUrl);

    const response = await axios.get(apiUrl, {
      params: {
        status: 'approve',
        per_page: batchSize,
      },
      auth: {
        username: config.WORDPRESS_USERNAME,
        password: config.WORDPRESS_APP_PASSWORD,
      },
      timeout: 10000,
    });

    console.log('Código de estado HTTP:', response.status);

    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error('Formato de respuesta inesperado:', response.data);
      return [];
    }
  } catch (error) {
    if (error.response) {
      console.error('Código de estado de error:', error.response.status);
      console.error('Datos de error:', error.response.data);
    } else {
      console.error('Mensaje de error:', error.message);
    }
    return [];
  }
}

// Marcar un comentario como procesado en WordPress
async function markCommentAsProcessed(commentId) {
  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/wp-json/wp/v2/comments/${commentId}`;

  const data = {
    meta: {
      processed: true, // Asegúrate de que tu WordPress soporte metadatos personalizados para comentarios
    },
  };

  try {
    const response = await axios.put(apiUrl, data, {
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
