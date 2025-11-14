const ApiKey = require('../models/ApiKey');
const logger = require('../config/logger');

// @desc    Get all API keys
// @route   GET /api/api-keys
// @access  Private
const getApiKeys = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const query = req.tenantQuery({
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    });

    const apiKeys = await ApiKey.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-key'); // Don't return full key

    // Add masked key for display
    const apiKeysWithMasked = apiKeys.map(key => ({
      ...key.toObject(),
      maskedKey: key.getMaskedKey()
    }));

    const total = await ApiKey.countDocuments(query);

    res.status(200).json({
      success: true,
      data: apiKeysWithMasked,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting API keys'
    });
  }
};

// @desc    Get single API key
// @route   GET /api/api-keys/:id
// @access  Private
const getApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).select('-key');

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...apiKey.toObject(),
        maskedKey: apiKey.getMaskedKey()
      }
    });
  } catch (error) {
    logger.error('Get API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting API key'
    });
  }
};

// @desc    Create API key
// @route   POST /api/api-keys
// @access  Private
const createApiKey = async (req, res) => {
  try {
    const { name, scopes, expiresAt, rateLimit, ipWhitelist } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one scope is required'
      });
    }

    // Generate API key
    const { key, keyPrefix } = ApiKey.generateKey();

    const apiKeyData = {
      name,
      key,
      keyPrefix,
      scopes,
      tenantId: req.user.tenantId,
      userId: req.user._id,
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      ...(rateLimit && { rateLimit }),
      ...(ipWhitelist && { ipWhitelist })
    };

    const apiKey = await ApiKey.create(apiKeyData);

    // Return API key with full key (only shown once)
    res.status(201).json({
      success: true,
      data: {
        ...apiKey.toObject(),
        key // Include full key only on creation
      },
      message: 'API key created successfully. Save the key - it will not be shown again.'
    });
  } catch (error) {
    logger.error('Create API key error:', error);
    
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
      error: 'Server error creating API key'
    });
  }
};

// @desc    Update API key
// @route   PUT /api/api-keys/:id
// @access  Private
const updateApiKey = async (req, res) => {
  try {
    const { name, scopes, isActive, expiresAt, rateLimit, ipWhitelist } = req.body;

    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    // Update fields
    if (name) apiKey.name = name;
    if (scopes) apiKey.scopes = scopes;
    if (isActive !== undefined) apiKey.isActive = isActive;
    if (expiresAt) apiKey.expiresAt = new Date(expiresAt);
    if (rateLimit) apiKey.rateLimit = rateLimit;
    if (ipWhitelist) apiKey.ipWhitelist = ipWhitelist;

    await apiKey.save();

    res.status(200).json({
      success: true,
      data: {
        ...apiKey.toObject(),
        maskedKey: apiKey.getMaskedKey()
      }
    });
  } catch (error) {
    logger.error('Update API key error:', error);
    
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
      error: 'Server error updating API key'
    });
  }
};

// @desc    Delete API key
// @route   DELETE /api/api-keys/:id
// @access  Private
const deleteApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    logger.error('Delete API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting API key'
    });
  }
};

// @desc    Revoke API key
// @route   POST /api/api-keys/:id/revoke
// @access  Private
const revokeApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    apiKey.isActive = false;
    await apiKey.save();

    res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    logger.error('Revoke API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error revoking API key'
    });
  }
};

module.exports = {
  getApiKeys,
  getApiKey,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey
};


