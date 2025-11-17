const ClientUser = require('../models/ClientUser');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * @desc    Register client user
 * @route   POST /api/client-auth/register
 * @access  Public
 */
const registerClient = async (req, res) => {
  try {
    const { email, password, customerId, tenantId } = req.body;

    // Check if customer exists
    const customer = await Customer.findOne({
      _id: customerId,
      tenantId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Check if client user already exists
    const existingClient = await ClientUser.findOne({
      $or: [
        { email },
        { customerId }
      ]
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'Client account already exists for this customer'
      });
    }

    // Create client user
    const clientUser = await ClientUser.create({
      email,
      password,
      customerId,
      tenantId
    });

    // Generate token
    const token = jwt.sign(
      { 
        id: clientUser._id,
        customerId: clientUser.customerId,
        tenantId: clientUser.tenantId,
        type: 'CLIENT'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        clientUser: {
          id: clientUser._id,
          email: clientUser.email,
          customerId: clientUser.customerId
        }
      }
    });
  } catch (error) {
    logger.error('Register client error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error registering client'
    });
  }
};

/**
 * @desc    Login client user
 * @route   POST /api/client-auth/login
 * @access  Public
 */
const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find client user with password
    const clientUser = await ClientUser.findOne({ email })
      .select('+password')
      .populate('customerId', 'name email phone address');

    if (!clientUser || !clientUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await clientUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    clientUser.lastLogin = new Date();
    await clientUser.save();

    // Generate token
    const token = jwt.sign(
      { 
        id: clientUser._id,
        customerId: clientUser.customerId,
        tenantId: clientUser.tenantId,
        type: 'CLIENT'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        clientUser: {
          id: clientUser._id,
          email: clientUser.email,
          customerId: clientUser.customerId,
          customer: clientUser.customerId
        }
      }
    });
  } catch (error) {
    logger.error('Login client error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error logging in client'
    });
  }
};

/**
 * @desc    Get current client user
 * @route   GET /api/client-auth/me
 * @access  Private (Client)
 */
const getMe = async (req, res) => {
  try {
    const clientUser = await ClientUser.findById(req.user.id)
      .populate('customerId', 'name email phone address')
      .populate('tenantId', 'name');

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        error: 'Client user not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: clientUser._id,
        email: clientUser.email,
        customer: clientUser.customerId,
        tenant: clientUser.tenantId,
        lastLogin: clientUser.lastLogin
      }
    });
  } catch (error) {
    logger.error('Get client me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching client user'
    });
  }
};

module.exports = {
  registerClient,
  loginClient,
  getMe
};

