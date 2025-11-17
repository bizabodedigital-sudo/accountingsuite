const { Worker } = require('bullmq');
const webhookService = require('../services/webhookService');
const logger = require('../config/logger');

class WebhookWorker {
  constructor(connection) {
    this.connection = connection;
    this.worker = null;
  }

  start() {
    this.worker = new Worker(
      'webhook-retry',
      async (job) => {
        logger.info(`Processing webhook retry job ${job.id}`);
        await webhookService.retryFailedDeliveries();
      },
      {
        connection: this.connection,
        concurrency: 1,
        removeOnComplete: {
          count: 100,
          age: 24 * 3600 // 24 hours
        },
        removeOnFail: {
          count: 1000,
          age: 7 * 24 * 3600 // 7 days
        }
      }
    );

    this.worker.on('completed', (job) => {
      logger.info(`Webhook retry job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Webhook retry job ${job.id} failed:`, err);
    });

    // Also run periodic retry check every 5 minutes
    setInterval(async () => {
      try {
        await webhookService.retryFailedDeliveries();
      } catch (error) {
        logger.error('Error in periodic webhook retry:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.info('Webhook worker started');
  }

  stop() {
    if (this.worker) {
      this.worker.close();
      logger.info('Webhook worker stopped');
    }
  }
}

module.exports = WebhookWorker;




