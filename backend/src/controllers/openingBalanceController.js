const OpeningBalance = require('../models/OpeningBalance');
const ChartOfAccount = require('../models/ChartOfAccount');
const AccountingEngine = require('../services/accountingEngine');
const logger = require('../config/logger');

/**
 * @desc    Get all opening balances
 * @route   GET /api/opening-balances
 * @access  Private
 */
const getOpeningBalances = async (req, res) => {
  try {
    const { accountId, asOfDate } = req.query;
    
    const query = req.tenantQuery({
      ...(accountId && { accountId }),
      ...(asOfDate && { asOfDate: new Date(asOfDate) })
    });

    const balances = await OpeningBalance.find(query)
      .populate('accountId', 'code name type')
      .populate('customerId', 'name')
      .populate('productId', 'name')
      .sort({ asOfDate: -1, accountCode: 1 });

    res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error) {
    logger.error('Get opening balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting opening balances'
    });
  }
};

/**
 * @desc    Create opening balance
 * @route   POST /api/opening-balances
 * @access  Private (OWNER, ACCOUNTANT)
 */
const createOpeningBalance = async (req, res) => {
  try {
    const { accountId, balance, asOfDate, customerId, vendorId, productId, inventoryQuantity, inventoryValue, description } = req.body;

    if (!accountId || balance === undefined || !asOfDate) {
      return res.status(400).json({
        success: false,
        error: 'Account ID, balance, and as of date are required'
      });
    }

    // Verify account exists
    const account = await ChartOfAccount.findOne({
      _id: accountId,
      ...req.tenantQuery()
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if opening balance already exists for this account and date
    const existing = await OpeningBalance.findOne({
      accountId,
      asOfDate: new Date(asOfDate),
      ...req.tenantQuery()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Opening balance already exists for this account and date'
      });
    }

    const openingBalance = await OpeningBalance.create({
      accountId,
      accountCode: account.code,
      accountName: account.name,
      balance,
      asOfDate: new Date(asOfDate),
      customerId,
      vendorId,
      productId,
      inventoryQuantity,
      inventoryValue,
      description,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: openingBalance
    });
  } catch (error) {
    logger.error('Create opening balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating opening balance'
    });
  }
};

/**
 * @desc    Post opening balances to ledger
 * @route   POST /api/opening-balances/post
 * @access  Private (OWNER only)
 */
const postOpeningBalances = async (req, res) => {
  try {
    const { asOfDate } = req.body;

    if (!asOfDate) {
      return res.status(400).json({
        success: false,
        error: 'As of date is required'
      });
    }

    // Get all unposted opening balances for the date
    const balances = await OpeningBalance.find({
      ...req.tenantQuery(),
      asOfDate: new Date(asOfDate),
      isPosted: false
    }).populate('accountId');

    if (balances.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No unposted opening balances found for this date'
      });
    }

    const postedEntries = [];
    const errors = [];

    for (const balance of balances) {
      try {
        // Create journal entry for opening balance
        const entries = [];
        const account = balance.accountId;

        if (account.normalBalance === 'DEBIT') {
          entries.push({
            accountId: account._id,
            accountCode: account.code,
            accountName: account.name,
            debit: balance.balance,
            credit: 0,
            description: `Opening Balance - ${balance.description || account.name}`
          });
          // Credit: Opening Balance Equity account
          const equityAccount = await AccountingEngine.getAccountByCode('5010', req.user.tenantId);
          const equityAccountDoc = await ChartOfAccount.findById(equityAccount);
          entries.push({
            accountId: equityAccount,
            accountCode: equityAccountDoc.code,
            accountName: equityAccountDoc.name,
            debit: 0,
            credit: balance.balance,
            description: `Opening Balance - ${balance.description || account.name}`
          });
        } else {
          entries.push({
            accountId: account._id,
            accountCode: account.code,
            accountName: account.name,
            debit: 0,
            credit: balance.balance,
            description: `Opening Balance - ${balance.description || account.name}`
          });
          // Debit: Opening Balance Equity account
          const equityAccount = await AccountingEngine.getAccountByCode('5010', req.user.tenantId);
          const equityAccountDoc = await ChartOfAccount.findById(equityAccount);
          entries.push({
            accountId: equityAccount,
            accountCode: equityAccountDoc.code,
            accountName: equityAccountDoc.name,
            debit: balance.balance,
            credit: 0,
            description: `Opening Balance - ${balance.description || account.name}`
          });
        }

        const result = await AccountingEngine.createJournalEntry({
          entryDate: balance.asOfDate,
          description: `Opening Balance - ${account.name}`,
          entries,
          entryType: 'OPENING_BALANCE',
          tenantId: req.user.tenantId,
          userId: req.user._id
        });

        // Update opening balance
        balance.isPosted = true;
        balance.postedAt = new Date();
        balance.journalEntryId = result.journalEntry._id;
        await balance.save();

        // Update account opening balance
        account.openingBalance = balance.balance;
        account.currentBalance = balance.balance;
        await account.save();

        postedEntries.push(balance);
      } catch (error) {
        errors.push({
          accountCode: balance.accountCode,
          error: error.message
        });
        logger.error(`Error posting opening balance for ${balance.accountCode}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Posted ${postedEntries.length} opening balances`,
      data: {
        posted: postedEntries,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Post opening balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error posting opening balances'
    });
  }
};

module.exports = {
  getOpeningBalances,
  createOpeningBalance,
  postOpeningBalances
};

