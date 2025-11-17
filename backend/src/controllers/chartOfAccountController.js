const ChartOfAccount = require('../models/ChartOfAccount');
const logger = require('../config/logger');

/**
 * @desc    Get all chart of accounts
 * @route   GET /api/chart-of-accounts
 * @access  Private
 */
const getAccounts = async (req, res) => {
  try {
    const { type, isActive, category } = req.query;
    
    const query = req.tenantQuery({
      ...(type && { type }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(category && { category })
    });

    const accounts = await ChartOfAccount.find(query)
      .populate('parentAccountId', 'code name')
      .sort({ code: 1 });

    res.status(200).json({
      success: true,
      data: accounts
    });
  } catch (error) {
    logger.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting accounts'
    });
  }
};

/**
 * @desc    Get single account
 * @route   GET /api/chart-of-accounts/:id
 * @access  Private
 */
const getAccount = async (req, res) => {
  try {
    const account = await ChartOfAccount.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('parentAccountId');

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    logger.error('Get account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting account'
    });
  }
};

/**
 * @desc    Create account
 * @route   POST /api/chart-of-accounts
 * @access  Private (OWNER, ACCOUNTANT)
 */
const createAccount = async (req, res) => {
  try {
    const { code, name, type, category, parentAccountId, description, openingBalance } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Code, name, and type are required'
      });
    }

    // Check if code already exists
    const existingAccount = await ChartOfAccount.findOne({
      code: code.toUpperCase(),
      ...req.tenantQuery()
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Account code already exists'
      });
    }

    const account = await ChartOfAccount.create({
      code: code.toUpperCase(),
      name,
      type,
      category,
      parentAccountId,
      description,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    logger.error('Create account error:', error);
    
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
      error: 'Server error creating account'
    });
  }
};

/**
 * @desc    Update account
 * @route   PUT /api/chart-of-accounts/:id
 * @access  Private (OWNER, ACCOUNTANT)
 */
const updateAccount = async (req, res) => {
  try {
    const account = await ChartOfAccount.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    if (account.isSystemAccount && (req.body.code || req.body.type)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify code or type of system account'
      });
    }

    const { name, category, description, isActive } = req.body;

    if (name) account.name = name;
    if (category !== undefined) account.category = category;
    if (description !== undefined) account.description = description;
    if (isActive !== undefined) account.isActive = isActive;

    await account.save();

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    logger.error('Update account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating account'
    });
  }
};

/**
 * @desc    Initialize default Jamaican COA
 * @route   POST /api/chart-of-accounts/initialize
 * @access  Private (OWNER only)
 */
const initializeCOA = async (req, res) => {
  try {
    // Check if accounts already exist
    const existingAccounts = await ChartOfAccount.countDocuments(req.tenantQuery());

    if (existingAccounts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Chart of accounts already initialized. Delete existing accounts first.'
      });
    }

    const defaultAccounts = ChartOfAccount.getDefaultJamaicanCOA(
      req.user.tenantId,
      req.user._id
    );

    // Process accounts to set parent relationships
    const accountMap = new Map();
    const accountsToCreate = [];

    // First pass: create all accounts
    for (const accountData of defaultAccounts) {
      const { parentCode, ...accountFields } = accountData;
      const account = await ChartOfAccount.create(accountFields);
      accountMap.set(account.code, account);
      accountsToCreate.push({ account, parentCode });
    }

    // Second pass: set parent relationships
    for (const { account, parentCode } of accountsToCreate) {
      if (parentCode) {
        const parent = accountMap.get(parentCode);
        if (parent) {
          account.parentAccountId = parent._id;
          await account.save();
        }
      }
    }

    const createdAccounts = await ChartOfAccount.find(req.tenantQuery()).sort({ code: 1 });

    logger.info(`Initialized ${createdAccounts.length} default accounts for tenant ${req.user.tenantId}`);

    res.status(201).json({
      success: true,
      message: `Initialized ${createdAccounts.length} default accounts`,
      data: createdAccounts
    });
  } catch (error) {
    logger.error('Initialize COA error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error initializing chart of accounts'
    });
  }
};

/**
 * @desc    Delete account
 * @route   DELETE /api/chart-of-accounts/:id
 * @access  Private (OWNER only)
 */
const deleteAccount = async (req, res) => {
  try {
    const account = await ChartOfAccount.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    if (account.isSystemAccount) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system account'
      });
    }

    // Check if account has ledger entries
    const LedgerEntry = require('../models/LedgerEntry');
    const hasEntries = await LedgerEntry.countDocuments({
      accountId: account._id,
      ...req.tenantQuery()
    });

    if (hasEntries > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete account with existing ledger entries. Deactivate instead.'
      });
    }

    await account.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting account'
    });
  }
};

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  initializeCOA,
  deleteAccount
};

