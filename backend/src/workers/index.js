const { Queue } = require('bullmq');
const EmailWorker = require('./emailWorker');
const config = require('../config/env');
const logger = require('../config/logger');

class WorkerManager {
  constructor() {
    this.connection = {
      host: config.redis.url.split('://')[1].split(':')[0],
      port: parseInt(config.redis.url.split(':')[2]) || 6379
    };
    
    this.queues = {};
    this.workers = {};
  }

  async start() {
    try {
      logger.info('Starting worker manager...');
      
      // Initialize queues
      this.queues.email = new Queue('email-queue', { connection: this.connection });
      
      // Initialize workers
      this.workers.email = new EmailWorker(this.connection);
      this.workers.email.start();
      
      // Setup queue monitoring
      this.setupQueueMonitoring();
      
      logger.info('Worker manager started successfully');
    } catch (error) {
      logger.error('Failed to start worker manager:', error);
      process.exit(1);
    }
  }

  setupQueueMonitoring() {
    // Monitor queue health
    setInterval(async () => {
      try {
        const emailQueue = this.queues.email;
        const waiting = await emailQueue.getWaiting();
        const active = await emailQueue.getActive();
        const completed = await emailQueue.getCompleted();
        const failed = await emailQueue.getFailed();

        logger.info(`Queue status - Waiting: ${waiting.length}, Active: ${active.length}, Completed: ${completed.length}, Failed: ${failed.length}`);
      } catch (error) {
        logger.error('Queue monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  async addEmailJob(type, data, options = {}) {
    try {
      const job = await this.queues.email.add(type, { type, data }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...options
      });

      logger.info(`Email job ${job.id} added to queue`);
      return job;
    } catch (error) {
      logger.error('Failed to add email job:', error);
      throw error;
    }
  }

  async stop() {
    try {
      logger.info('Stopping worker manager...');
      
      // Stop all workers
      Object.values(this.workers).forEach(worker => {
        if (worker.stop) {
          worker.stop();
        }
      });
      
      // Close all queues
      await Promise.all(
        Object.values(this.queues).map(queue => queue.close())
      );
      
      logger.info('Worker manager stopped');
    } catch (error) {
      logger.error('Error stopping worker manager:', error);
    }
  }
}

// Start worker manager if this file is run directly
if (require.main === module) {
  const workerManager = new WorkerManager();
  
  workerManager.start().catch(error => {
    logger.error('Worker manager startup failed:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await workerManager.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await workerManager.stop();
    process.exit(0);
  });
}

module.exports = WorkerManager;













