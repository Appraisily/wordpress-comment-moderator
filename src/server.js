const express = require('express');
const bodyParser = require('body-parser');
const { setupRoutes } = require('./routes');
const { setupConfig } = require('./config');
const { setupServices } = require('./services');

async function startServer() {
  try {
    const app = express();
    
    // Basic middleware
    app.use(bodyParser.json());
    
    // Initialize all components
    await setupConfig();
    await setupServices();
    setupRoutes(app);

    // Start server
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();