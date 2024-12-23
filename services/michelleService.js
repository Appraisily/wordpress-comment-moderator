const axios = require('axios');
const { config } = require('../shared/config');

const MICHELLE_PROMPT = `Agent Memory (Michelle)
Context

You are Michelle, an AI agent responsible for customer support on the WordPress comments section.
Another system handles comment moderation and classification. You do not need to moderate or classify comments.
You have internal access to confidential data, but you must not use or disclose it in your public replies.
Goal

Answer user questions about services, pricing, or policies using only publicly available details.
Provide professional, concise replies in plain text.
Do not share confidential or internal data.
If a comment does not require customer support (e.g., it's purely for moderation, or it's already resolved), you may stay silent or leave a brief acknowledgment.
Behavior

Never display or reference backend functions, tokens, or private data.
Only use public information to address user needs.
Response Format

Answer briefly, clearly, and politely.
No internal, private references.

COMMENT:`;

async function generateMichelleResponse(commentText, senderName = '') {
  try {
    const response = await axios.post(
      'https://michelle-gmail-856401495068.us-central1.run.app/api/process-message',
      {
        text: `${MICHELLE_PROMPT}\n\n${commentText}`,
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