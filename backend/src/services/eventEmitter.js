const EventEmitter = require('events');
const webhookService = require('./webhookService');
const logger = require('../config/logger');

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners
  }

  /**
   * Emit an event and trigger webhooks
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {Object} tenantId - Tenant ID
   */
  async emitEvent(event, data, tenantId) {
    try {
      // Emit event for internal listeners
      this.emit(event, data, tenantId);

      // Trigger webhooks asynchronously (don't wait for completion)
      webhookService.triggerWebhooks(event, data, tenantId)
        .catch(error => {
          logger.error(`Error triggering webhooks for event ${event}:`, error);
        });

      logger.debug(`Event ${event} emitted for tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Error emitting event ${event}:`, error);
    }
  }
}

// Create singleton instance
const eventEmitter = new AppEventEmitter();

module.exports = eventEmitter;


