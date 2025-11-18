const Integration = require('../models/Integration');
const Webhook = require('../models/Webhook');
const ApiKey = require('../models/ApiKey');
const logger = require('../config/logger');

// @desc    Get all integrations
// @route   GET /api/integrations
// @access  Private
const getIntegrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isActive, isConnected } = req.query;
    
    const query = req.tenantQuery({
      ...(type && { type }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(isConnected !== undefined && { isConnected: isConnected === 'true' })
    });

    const integrations = await Integration.find(query)
      .populate('webhookId', 'name url platform')
      .populate('apiKeyId', 'name keyPrefix')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Integration.countDocuments(query);

    res.status(200).json({
      success: true,
      data: integrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get integrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting integrations'
    });
  }
};

// @desc    Get single integration
// @route   GET /api/integrations/:id
// @access  Private
const getIntegration = async (req, res) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('webhookId', 'name url platform')
      .populate('apiKeyId', 'name keyPrefix');

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Get integration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting integration'
    });
  }
};

// @desc    Create integration
// @route   POST /api/integrations
// @access  Private
const createIntegration = async (req, res) => {
  try {
    const { name, type, config, credentials, webhookId, apiKeyId } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    // Validate type
    const validTypes = ['n8n', 'zapier', 'make', 'webhook', 'api', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate webhook or API key if provided
    if (webhookId) {
      const webhook = await Webhook.findOne({
        _id: webhookId,
        ...req.tenantQuery()
      });
      if (!webhook) {
        return res.status(400).json({
          success: false,
          error: 'Webhook not found'
        });
      }
    }

    if (apiKeyId) {
      const apiKey = await ApiKey.findOne({
        _id: apiKeyId,
        ...req.tenantQuery()
      });
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key not found'
        });
      }
    }

    const integrationData = {
      name,
      type,
      tenantId: req.user.tenantId,
      userId: req.user._id,
      ...(config && { config }),
      ...(credentials && { credentials }),
      ...(webhookId && { webhookId }),
      ...(apiKeyId && { apiKeyId })
    };

    const integration = await Integration.create(integrationData);

    const populatedIntegration = await Integration.findById(integration._id)
      .populate('webhookId', 'name url platform')
      .populate('apiKeyId', 'name keyPrefix');

    res.status(201).json({
      success: true,
      data: populatedIntegration
    });
  } catch (error) {
    logger.error('Create integration error:', error);
    
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
      error: 'Server error creating integration'
    });
  }
};

// @desc    Update integration
// @route   PUT /api/integrations/:id
// @access  Private
const updateIntegration = async (req, res) => {
  try {
    const { name, config, credentials, isActive, isConnected, syncStatus, metadata } = req.body;

    const integration = await Integration.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Update fields
    if (name) integration.name = name;
    if (config) integration.config = config;
    if (credentials) integration.credentials = credentials;
    if (isActive !== undefined) integration.isActive = isActive;
    if (isConnected !== undefined) integration.isConnected = isConnected;
    if (syncStatus) integration.syncStatus = syncStatus;
    if (metadata) integration.metadata = metadata;

    // Update lastSync if syncStatus is success
    if (syncStatus === 'success') {
      integration.lastSync = new Date();
    }

    await integration.save();

    const populatedIntegration = await Integration.findById(integration._id)
      .populate('webhookId', 'name url platform')
      .populate('apiKeyId', 'name keyPrefix');

    res.status(200).json({
      success: true,
      data: populatedIntegration
    });
  } catch (error) {
    logger.error('Update integration error:', error);
    
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
      error: 'Server error updating integration'
    });
  }
};

// @desc    Delete integration
// @route   DELETE /api/integrations/:id
// @access  Private
const deleteIntegration = async (req, res) => {
  try {
    const integration = await Integration.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    logger.error('Delete integration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting integration'
    });
  }
};

// @desc    Test integration connection
// @route   POST /api/integrations/:id/test
// @access  Private
const testIntegration = async (req, res) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('webhookId')
      .populate('apiKeyId');

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Test based on integration type
    let testResult = { success: false, message: '' };

    if (integration.type === 'webhook' && integration.webhookId) {
      const webhookService = require('../services/webhookService');
      const result = await webhookService.testWebhook(integration.webhookId);
      testResult = {
        success: result.success,
        message: result.success ? 'Webhook test successful' : `Webhook test failed: ${result.error}`
      };
    } else if (integration.type === 'api' && integration.apiKeyId) {
      // API key is already validated, just check if it's active
      testResult = {
        success: integration.apiKeyId.isActive && !integration.apiKeyId.isExpired(),
        message: integration.apiKeyId.isActive && !integration.apiKeyId.isExpired()
          ? 'API key is valid and active'
          : 'API key is inactive or expired'
      };
    } else {
      testResult = {
        success: false,
        message: 'Integration type does not support testing or missing required connection'
      };
    }

    // Update integration status
    if (testResult.success) {
      integration.isConnected = true;
      integration.syncStatus = 'success';
      integration.lastSync = new Date();
    } else {
      integration.isConnected = false;
      integration.syncStatus = 'failed';
    }
    await integration.save();

    res.status(200).json({
      success: testResult.success,
      message: testResult.message,
      data: {
        isConnected: integration.isConnected,
        syncStatus: integration.syncStatus,
        lastSync: integration.lastSync
      }
    });
  } catch (error) {
    logger.error('Test integration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error testing integration'
    });
  }
};

module.exports = {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
};





