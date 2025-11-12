const Tenant = require('../models/Tenant');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get tenant settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tenant: {
          name: tenant.name,
          currency: tenant.currency,
          plan: tenant.plan,
          address: tenant.address,
          phone: tenant.phone,
          email: tenant.email,
          taxId: tenant.taxId
        },
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          phone: req.user.phone
        }
      }
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting settings'
    });
  }
};

// @desc    Update tenant settings
// @route   PUT /api/settings/tenant
// @access  Private
const updateTenantSettings = async (req, res) => {
  try {
    const { name, currency, address, phone, email, taxId } = req.body;
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      {
        ...(name && { name }),
        ...(currency && { currency }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(taxId !== undefined && { taxId })
      },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: tenant.name,
        currency: tenant.currency,
        plan: tenant.plan,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
        taxId: tenant.taxId
      }
    });
  } catch (error) {
    logger.error('Update tenant settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating tenant settings'
    });
  }
};

// @desc    Update user profile settings
// @route   PUT /api/settings/profile
// @access  Private
const updateProfileSettings = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    logger.error('Update profile settings error:', error);
    
    // Handle validation errors
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
      error: 'Server error updating profile settings'
    });
  }
};

// @desc    Update preferences
// @route   PUT /api/settings/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { currency, dateFormat, theme } = req.body;
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      {
        ...(currency && { currency }),
        ...(dateFormat && { dateFormat }),
        ...(theme && { theme })
      },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        currency: tenant.currency,
        dateFormat: tenant.dateFormat,
        theme: tenant.theme
      }
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating preferences'
    });
  }
};

module.exports = {
  getSettings,
  updateTenantSettings,
  updateProfileSettings,
  updatePreferences
};

