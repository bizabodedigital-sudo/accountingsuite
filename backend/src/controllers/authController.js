const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');
const AuditLogService = require('../services/auditLogService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      logger.error('Registration failed: MongoDB is not connected');
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.'
      });
    }

    const { email, password, firstName, lastName, tenantName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create or find tenant
    let tenant;
    const tenantNameToUse = tenantName || 'Default Company';
    
    // Check if tenant already exists
    tenant = await Tenant.findOne({ name: tenantNameToUse });
    
    if (!tenant) {
      tenant = await Tenant.create({
        name: tenantNameToUse,
        currency: 'JMD',
        plan: 'STARTER'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'OWNER',
      tenantId: tenant._id
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.getPublicProfile(),
      tenant: {
        id: tenant._id,
        name: tenant.name,
        currency: tenant.currency,
        plan: tenant.plan
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      logger.error('Login failed: MongoDB is not connected');
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.'
      });
    }

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check for user (include password for comparison)
    let user;
    try {
      user = await User.findOne({ email }).select('+password').populate('tenantId');
    } catch (dbError) {
      logger.error('Database error during login:', dbError);
      // Check if it's a connection error
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          error: 'Database connection unavailable. Please try again later.'
        });
      }
      // Re-throw other database errors
      throw dbError;
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await AuditLogService.logLogin(user, req.ip, req.get('user-agent'), true);

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: user.getPublicProfile(),
      tenant: {
        id: user.tenantId._id,
        name: user.tenantId.name,
        currency: user.tenantId.currency,
        plan: user.tenantId.plan
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('tenantId');
    
    res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
      tenant: {
        id: user.tenantId._id,
        name: user.tenantId.name,
        currency: user.tenantId.currency,
        plan: user.tenantId.plan
      }
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};






