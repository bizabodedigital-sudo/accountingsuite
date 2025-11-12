require('dotenv').config();
const logger = require('./config/logger');

// Simple worker that just logs and stays alive
const startWorker = () => {
  logger.info('🔄 Background worker started');
  
  // Keep the process alive
  setInterval(() => {
    logger.info('Worker heartbeat - still running');
  }, 60000); // Log every minute
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Worker received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Worker received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the worker
startWorker();
