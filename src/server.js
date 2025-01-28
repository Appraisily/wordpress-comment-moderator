const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { initializeConfig } = require('./config');
const { startPeriodicProcessing } = require('./services/scheduler');

async function startServer() {
  try {
    // Initialize configuration first
    await initializeConfig();

    // Create Express app
    const app = express();
    
    // Middleware
    app.use(bodyParser.json());
    
    // Routes
    app.use('/', routes);

    // Start server
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      
      // Start periodic processing after server is running
      startPeriodicProcessing();
    });

    // Handle shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
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

// Start the server
startServer();