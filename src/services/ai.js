const openai = require('openai');
const axios = require('axios');
const { getConfig } = require('../config');

class AIService {
  constructor() {
    this.openaiApi = null;
  }

  setup() {
    const config = getConfig();
    const openaiConfig = new openai.Configuration({
      apiKey: config.ai.openaiKey,
    });
    this.openaiApi = new openai.OpenAIApi(openaiConfig);
    console.log('OpenAI API initialized');
  }

  async classifyComment(commentText) {
    if (!this.openaiApi) this.setup();

    const prompt = `Clasifica el siguiente comentario como "Correcto" o "Spam". Solo responde con una de esas dos opciones y nada más.

Comentario: "${commentText}"

Clasificación:`;

    try {
      console.log('Attempting to classify comment with OpenAI');
      console.log('Using model: gpt-4o-mini');
      
      const completion = await this.openaiApi.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 6,
      });

      const classification = completion.data.choices[0].message.content.trim();
      console.log('Received classification:', classification);
      return classification === 'Correcto' || classification === 'Spam' ? classification : 'Spam';
    } catch (error) {
      console.error('Comment classification failed. Details:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers
        }
      });
      return 'Spam';
    }
  }

  async generateMichelleResponse(commentText, senderName = '') {
    if (!this.openaiApi) this.setup();
    
    const config = getConfig();
    try {
      console.log('Attempting to generate Michelle response');
      const response = await axios.post(
        'https://michelle-gmail-856401495068.us-central1.run.app/api/process-message',
        {
          text: `${this.getMichellePrompt()}\n\n${commentText}`,
          senderName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.ai.michelleKey
          },
          timeout: 30000
        }
      );

      console.log('Michelle response generated successfully');
      return response.data?.success ? response.data.response?.text : null;
    } catch (error) {
      console.error('Michelle response generation failed. Details:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return null;
    }
  }

  getMichellePrompt() {
    return `Agent Memory (Michelle)
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
  }
}

module.exports = { AIService };