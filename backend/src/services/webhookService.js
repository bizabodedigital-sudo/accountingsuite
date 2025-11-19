const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const logger = require('../config/logger');

class WebhookService {
  /**
   * Trigger webhooks for a specific event
   * @param {string} event - Event name (e.g., 'invoice.created')
   * @param {Object} payload - Event payload data
   * @param {Object} tenantId - Tenant ID
   */
  async triggerWebhooks(event, payload, tenantId) {
    try {
      // Find all active webhooks for this tenant that listen to this event
      const webhooks = await Webhook.find({
        tenantId,
        isActive: true,
        events: event
      });

      if (webhooks.length === 0) {
        logger.debug(`No webhooks found for event ${event} and tenant ${tenantId}`);
        return;
      }

      logger.info(`Triggering ${webhooks.length} webhook(s) for event ${event}`);

      // Trigger each webhook asynchronously
      const promises = webhooks.map(webhook => 
        this.deliverWebhook(webhook, event, payload)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Error triggering webhooks:', error);
      throw error;
    }
  }

  /**
   * Deliver a webhook to a specific URL
   * @param {Object} webhook - Webhook document
   * @param {string} event - Event name
   * @param {Object} payload - Event payload
   */
  async deliverWebhook(webhook, event, payload) {
    const deliveryData = {
      webhookId: webhook._id,
      tenantId: webhook.tenantId,
      event,
      payload: this.formatPayload(webhook, event, payload),
      status: 'pending',
      attemptCount: 0,
      maxAttempts: webhook.retryConfig?.maxRetries || 3
    };

    // Create delivery record
    const delivery = await WebhookDelivery.create(deliveryData);

    try {
      // Prepare webhook payload
      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
        webhookId: webhook._id.toString()
      };

      // Generate signature
      const signature = this.generateSignature(
        JSON.stringify(webhookPayload),
        webhook.secret
      );

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': new Date().toISOString(),
        'User-Agent': 'Bizabode-Webhooks/1.0'
      };

      // Add custom headers
      if (webhook.headers && webhook.headers.size > 0) {
        webhook.headers.forEach((value, key) => {
          headers[key] = value;
        });
      }

      // Platform-specific headers
      if (webhook.platform === 'n8n') {
        headers['X-n8n-Webhook'] = 'true';
      } else if (webhook.platform === 'zapier') {
        headers['X-Zapier-Webhook'] = 'true';
      } else if (webhook.platform === 'make') {
        headers['X-Make-Webhook'] = 'true';
      }

      // Make HTTP request
      const response = await axios.post(webhook.url, webhookPayload, {
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      // Update delivery record
      delivery.status = response.status >= 200 && response.status < 300 ? 'success' : 'failed';
      delivery.responseStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000); // Limit response body size
      delivery.deliveredAt = new Date();
      delivery.attemptCount += 1;

      // Update webhook statistics
      if (delivery.status === 'success') {
        webhook.lastSuccess = new Date();
        webhook.successCount = (webhook.successCount || 0) + 1;
      } else {
        webhook.lastFailure = new Date();
        webhook.failureCount = (webhook.failureCount || 0) + 1;
      }

      webhook.lastTriggered = new Date();
      await webhook.save();
      await delivery.save();

      logger.info(`Webhook ${webhook._id} delivered successfully (${response.status})`);

      return { success: true, delivery, response };
    } catch (error) {
      // Handle delivery failure
      delivery.status = 'failed';
      delivery.attemptCount += 1;
      delivery.errorMessage = error.message;
      delivery.responseStatus = error.response?.status || null;
      delivery.responseBody = error.response?.data ? JSON.stringify(error.response.data).substring(0, 1000) : null;

      // Schedule retry if attempts remaining
      if (delivery.attemptCount < delivery.maxAttempts) {
        delivery.status = 'retrying';
        const retryDelay = this.calculateRetryDelay(
          delivery.attemptCount,
          webhook.retryConfig?.retryDelay || 1000
        );
        delivery.nextRetryAt = new Date(Date.now() + retryDelay);
        logger.info(`Webhook ${webhook._id} will retry in ${retryDelay}ms`);
      } else {
        webhook.lastFailure = new Date();
        webhook.failureCount = (webhook.failureCount || 0) + 1;
        logger.error(`Webhook ${webhook._id} failed after ${delivery.maxAttempts} attempts`);
      }

      webhook.lastTriggered = new Date();
      await webhook.save();
      await delivery.save();

      return { success: false, delivery, error: error.message };
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedDeliveries() {
    try {
      const now = new Date();
      const failedDeliveries = await WebhookDelivery.find({
        status: 'retrying',
        nextRetryAt: { $lte: now }
      }).populate('webhookId');

      logger.info(`Found ${failedDeliveries.length} webhook deliveries to retry`);

      for (const delivery of failedDeliveries) {
        if (!delivery.webhookId || !delivery.webhookId.isActive) {
          continue;
        }

        await this.deliverWebhook(
          delivery.webhookId,
          delivery.event,
          delivery.payload
        );
      }
    } catch (error) {
      logger.error('Error retrying failed webhook deliveries:', error);
    }
  }

  /**
   * Format payload based on webhook platform
   */
  formatPayload(webhook, event, payload) {
    // Platform-specific formatting
    if (webhook.platform === 'n8n') {
      return {
        event,
        data: payload,
        timestamp: new Date().toISOString()
      };
    } else if (webhook.platform === 'zapier') {
      return {
        event_type: event,
        payload: payload,
        timestamp: new Date().toISOString()
      };
    } else if (webhook.platform === 'make') {
      return {
        event,
        body: payload,
        timestamp: new Date().toISOString()
      };
    }

    // Default format
    return payload;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attemptCount, baseDelay) {
    return Math.min(baseDelay * Math.pow(2, attemptCount - 1), 60000); // Max 60 seconds
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Test webhook connection
   */
  async testWebhook(webhook) {
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Bizabode',
        webhookId: webhook._id.toString(),
        webhookName: webhook.name
      }
    };

    return await this.deliverWebhook(webhook, 'webhook.test', testPayload.data);
  }
}

module.exports = new WebhookService();






