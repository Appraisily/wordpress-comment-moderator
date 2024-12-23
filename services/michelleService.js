const axios = require('axios');
const { config } = require('../shared/config');

async function generateMichelleResponse(commentText, senderName = '') {
  try {
    const response = await axios.post(
      'https://michelle-gmail-856401495068.us-central1.run.app/api/process-message',
      {
        text: commentText,
        senderName: senderName,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.MICHELLE_API_KEY
        },
        timeout: 30000 // 30 segundos de timeout
      }
    );

    if (response.data?.success && response.data?.response?.text) {
      return response.data.response.text;
    } else if (!response.data?.success) {
      console.error('Error de Michelle:', {
        code: response.data?.error?.code,
        message: response.data?.error?.message,
        details: response.data?.error?.details
      });
      return null;
    } else {
      console.error('Respuesta inesperada de Michelle:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error al generar respuesta con Michelle:', error.message);
    if (error.response?.data?.error) {
      console.error('Detalles del error:', {
        code: error.response.data.error.code,
        message: error.response.data.error.message,
        details: error.response.data.error.details
      });
    }
    return null;
  }
}

module.exports = { generateMichelleResponse };