const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('+password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user account is inactive'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      logger.error('JWT verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized, invalid token'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, user not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this resource`
      });
    }

    next();
  };
};

// Tenant isolation middleware
const tenantFilter = (model) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, user not authenticated'
      });
    }

    // Add tenant filter to request
    req.tenantQuery = (extra = {}) => ({
      tenantId: req.user.tenantId,
      ...extra
    });

    // Add tenant filter to model queries
    if (model) {
      req.model = model;
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  tenantFilter
};






