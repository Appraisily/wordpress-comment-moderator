const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const { config } = require('../shared/config');

async function handleNewComment(commentData) {
  // Extraer el contenido del comentario
  const { content, id, post } = commentData;

  // Usar OpenAI para moderar el comentario
  const isApproved = await moderateComment(content.rendered);
  if (!isApproved) {
    // Marcar el comentario como spam o eliminarlo
    await deleteComment(id);
    return;
  }

  // Generar una respuesta que incentive la compra
  const response = await generateResponse(content.rendered);

  // Publicar la respuesta en WordPress
  await postResponse(response, post, id);
}

async function moderateComment(commentText) {
  // Aquí puedes implementar lógica de moderación adicional si lo deseas
  // Por simplicidad, aprobamos todos los comentarios
  return true;
}

async function generateResponse(commentText) {
  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `El cliente ha comentado: "${commentText}". Genera una respuesta amable que lo incentive a realizar una compra en nuestra web. La respuesta debe ser en español y tener un tono amigable.`;

  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 150,
  });

  return completion.data.choices[0].text.trim();
}

async function postResponse(responseText, postId, parentId) {
  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/wp-json/wp/v2/comments`;

  const data = {
    content: responseText,
    post: postId,
    parent: parentId,
  };

  await axios.post(apiUrl, data, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });
}

async function deleteComment(commentId) {
  const auth = Buffer.from(`${config.WORDPRESS_USERNAME}:${config.WORDPRESS_APP_PASSWORD}`).toString('base64');
  const apiUrl = `${config.WORDPRESS_API_URL}/wp-json/wp/v2/comments/${commentId}`;

  await axios.delete(apiUrl, {
    headers: {
      'Authorization': `Basic ${auth}`,
    },
    params: {
      force: true, // Eliminar permanentemente
    },
  });
}

module.exports = {
  handleNewComment,
};
