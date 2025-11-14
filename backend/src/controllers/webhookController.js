const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const logger = require('../config/logger');
const webhookService = require('../services/webhookService');
const crypto = require('crypto');

// @desc    Get all webhooks
// @route   GET /api/webhooks
// @access  Private
const getWebhooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, platform } = req.query;
    
    const query = req.tenantQuery({
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(platform && { platform })
    });

    const webhooks = await Webhook.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-secret'); // Don't return secret

    const total = await Webhook.countDocuments(query);

    res.status(200).json({
      success: true,
      data: webhooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get webhooks error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting webhooks'
    });
  }
};

// @desc    Get single webhook
// @route   GET /api/webhooks/:id
// @access  Private
const getWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).select('-secret');

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    res.status(200).json({
      success: true,
      data: webhook
    });
  } catch (error) {
    logger.error('Get webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting webhook'
    });
  }
};

// @desc    Create webhook
// @route   POST /api/webhooks
// @access  Private
const createWebhook = async (req, res) => {
  try {
    const { name, url, events, platform, headers, retryConfig } = req.body;

    // Validate required fields
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, URL, and at least one event are required'
      });
    }

    // Validate URL format
    if (!/^https?:\/\/.+/.test(url)) {
      return res.status(400).json({
        success: false,
        error: 'URL must be a valid HTTP/HTTPS URL'
      });
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('base64url');

    const webhookData = {
      name,
      url,
      events,
      secret,
      platform: platform || 'generic',
      tenantId: req.user.tenantId,
      ...(headers && { headers }),
      ...(retryConfig && { retryConfig })
    };

    const webhook = await Webhook.create(webhookData);

    // Return webhook with secret (only shown once)
    const webhookResponse = webhook.toObject();
    res.status(201).json({
      success: true,
      data: webhookResponse,
      message: 'Webhook created successfully. Save the secret - it will not be shown again.'
    });
  } catch (error) {
    logger.error('Create webhook error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error creating webhook'
    });
  }
};

// @desc    Update webhook
// @route   PUT /api/webhooks/:id
// @access  Private
const updateWebhook = async (req, res) => {
  try {
    const { name, url, events, isActive, platform, headers, retryConfig } = req.body;

    const webhook = await Webhook.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    // Update fields
    if (name) webhook.name = name;
    if (url) {
      if (!/^https?:\/\/.+/.test(url)) {
        return res.status(400).json({
          success: false,
          error: 'URL must be a valid HTTP/HTTPS URL'
        });
      }
      webhook.url = url;
    }
    if (events) webhook.events = events;
    if (isActive !== undefined) webhook.isActive = isActive;
    if (platform) webhook.platform = platform;
    if (headers) webhook.headers = headers;
    if (retryConfig) webhook.retryConfig = retryConfig;

    await webhook.save();

    const webhookResponse = webhook.toObject();
    delete webhookResponse.secret;

    res.status(200).json({
      success: true,
      data: webhookResponse
    });
  } catch (error) {
    logger.error('Update webhook error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error updating webhook'
    });
  }
};

// @desc    Delete webhook
// @route   DELETE /api/webhooks/:id
// @access  Private
const deleteWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    logger.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting webhook'
    });
  }
};

// @desc    Test webhook
// @route   POST /api/webhooks/:id/test
// @access  Private
const testWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    const result = await webhookService.testWebhook(webhook);

    res.status(200).json({
      success: result.success,
      message: result.success 
        ? 'Webhook test delivered successfully' 
        : 'Webhook test failed',
      data: {
        deliveryId: result.delivery?._id,
        responseStatus: result.response?.status,
        error: result.error
      }
    });
  } catch (error) {
    logger.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error testing webhook'
    });
  }
};

// @desc    Get webhook deliveries
// @route   GET /api/webhooks/:id/deliveries
// @access  Private
const getWebhookDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Verify webhook belongs to tenant
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    const query = {
      webhookId: req.params.id,
      ...(status && { status })
    };

    const deliveries = await WebhookDelivery.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WebhookDelivery.countDocuments(query);

    res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get webhook deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting webhook deliveries'
    });
  }
};

// @desc    Regenerate webhook secret
// @route   POST /api/webhooks/:id/regenerate-secret
// @access  Private
const regenerateSecret = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('base64url');
    webhook.secret = newSecret;
    await webhook.save();

    res.status(200).json({
      success: true,
      data: {
        secret: newSecret,
        message: 'Secret regenerated successfully. Save the new secret - it will not be shown again.'
      }
    });
  } catch (error) {
    logger.error('Regenerate secret error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error regenerating secret'
    });
  }
};

module.exports = {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  regenerateSecret
};


