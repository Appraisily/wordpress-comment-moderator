const crypto = require('crypto');
const { getConfig } = require('../config');

async function authenticateWebhook(req, res, next) {
  try {
    const config = getConfig();
    const incomingSecret = req.headers['x-shared-secret'];

    if (!incomingSecret || !config.security.sharedSecret) {
      console.warn('Shared Secret not provided');
      return res.status(403).send('Unauthorized');
    }

    const incomingSecretBuffer = Buffer.from(incomingSecret);
    const storedSecretBuffer = Buffer.from(config.security.sharedSecret);

    if (incomingSecretBuffer.length !== storedSecretBuffer.length) {
      console.warn('Shared Secret length mismatch');
      return res.status(403).send('Unauthorized');
    }

    if (!crypto.timingSafeEqual(incomingSecretBuffer, storedSecretBuffer)) {
      console.warn('Invalid Shared Secret');
      return res.status(403).send('Unauthorized');
    }

    console.log('Shared Secret verified successfully');
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).send('Internal server error');
  }
}

module.exports = { authenticateWebhook };