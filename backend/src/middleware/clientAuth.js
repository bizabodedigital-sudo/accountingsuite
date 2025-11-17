const jwt = require('jsonwebtoken');
const ClientUser = require('../models/ClientUser');

/**
 * Protect routes for client users
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for client user
    if (decoded.type !== 'CLIENT') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    const clientUser = await ClientUser.findById(decoded.id).populate('customerId');

    if (!clientUser || !clientUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Client user no longer exists'
      });
    }

    req.user = {
      id: clientUser._id,
      customerId: clientUser.customerId._id,
      tenantId: clientUser.tenantId,
      type: 'CLIENT'
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

/**
 * Filter by tenant for client users
 */
const tenantFilter = () => {
  return (req, res, next) => {
    req.tenantQuery = (additionalQuery = {}) => {
      return {
        tenantId: req.user.tenantId,
        ...additionalQuery
      };
    };
    next();
  };
};

module.exports = { protect, tenantFilter };
