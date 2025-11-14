const ApiKey = require('../models/ApiKey');
const logger = require('../config/logger');

/**
 * Middleware to authenticate requests using API keys
 * Supports both Bearer token format and X-API-Key header
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    let apiKeyValue = null;

    // Try to get API key from Authorization header (Bearer format)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      apiKeyValue = req.headers.authorization.split(' ')[1];
    }
    // Try to get API key from X-API-Key header
    else if (req.headers['x-api-key']) {
      apiKeyValue = req.headers['x-api-key'];
    }

    if (!apiKeyValue) {
      return res.status(401).json({
        success: false,
        error: 'API key is required. Provide it in Authorization header (Bearer <key>) or X-API-Key header'
      });
    }

    // Find API key in database
    const apiKey = await ApiKey.findOne({ key: apiKeyValue });

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Check if API key is active
    if (!apiKey.isActive) {
      return res.status(401).json({
        success: false,
        error: 'API key is inactive'
      });
    }

    // Check if API key is expired
    if (apiKey.isExpired()) {
      return res.status(401).json({
        success: false,
        error: 'API key has expired'
      });
    }

    // Check IP whitelist if configured
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
    if (!apiKey.isIpAllowed(clientIp)) {
      return res.status(403).json({
        success: false,
        error: 'IP address not allowed'
      });
    }

    // Update usage statistics
    apiKey.lastUsed = new Date();
    apiKey.usageCount = (apiKey.usageCount || 0) + 1;
    await apiKey.save();

    // Attach API key info to request
    req.apiKey = apiKey;
    req.user = {
      _id: apiKey.userId,
      tenantId: apiKey.tenantId,
      role: 'API', // Special role for API access
      isApiKey: true
    };

    // Add tenant query helper
    req.tenantQuery = (extra = {}) => ({
      tenantId: apiKey.tenantId,
      ...extra
    });

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during API key authentication'
    });
  }
};

/**
 * Middleware to check if API key has required scope
 */
const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key authentication required'
      });
    }

    const hasScope = requiredScopes.some(scope => 
      req.apiKey.scopes.includes(scope)
    );

    if (!hasScope) {
      return res.status(403).json({
        success: false,
        error: `API key does not have required scope. Required: ${requiredScopes.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check rate limits for API key
 */
const checkRateLimit = async (req, res, next) => {
  try {
    if (!req.apiKey) {
      return next(); // Skip rate limiting if not using API key
    }

    const rateLimit = req.apiKey.rateLimit?.requestsPerMinute || 60;
    
    // Simple in-memory rate limiting (for production, use Redis)
    // This is a basic implementation - for production, use a proper rate limiter
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Check if we need to reset the counter
    if (!req.apiKey._lastRequestTime || (now - req.apiKey._lastRequestTime) > windowMs) {
      req.apiKey._requestCount = 0;
      req.apiKey._lastRequestTime = now;
    }

    req.apiKey._requestCount = (req.apiKey._requestCount || 0) + 1;

    if (req.apiKey._requestCount > rateLimit) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Too many requests.'
      });
    }

    next();
  } catch (error) {
    logger.error('Rate limit check error:', error);
    next(); // Continue on error
  }
};

module.exports = {
  apiKeyAuth,
  requireScope,
  checkRateLimit
};


