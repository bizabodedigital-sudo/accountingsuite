const JournalEntry = require('../models/JournalEntry');
const LedgerEntry = require('../models/LedgerEntry');
const AccountingEngine = require('../services/accountingEngine');
const logger = require('../config/logger');

/**
 * @desc    Get all journal entries
 * @route   GET /api/journal-entries
 * @access  Private
 */
const getJournalEntries = async (req, res) => {
  try {
    const { page = 1, limit = 20, entryType, status, startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      ...(entryType && { entryType }),
      ...(status && { status })
    });

    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    const entries = await JournalEntry.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('postedBy', 'firstName lastName')
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JournalEntry.countDocuments(query);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting journal entries'
    });
  }
};

/**
 * @desc    Get single journal entry with ledger entries
 * @route   GET /api/journal-entries/:id
 * @access  Private
 */
const getJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('createdBy', 'firstName lastName')
      .populate('postedBy', 'firstName lastName');

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Journal entry not found'
      });
    }

    const ledgerEntries = await LedgerEntry.find({
      journalEntryId: entry._id
    }).populate('accountId', 'code name type');

    res.status(200).json({
      success: true,
      data: {
        ...entry.toObject(),
        ledgerEntries
      }
    });
  } catch (error) {
    logger.error('Get journal entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting journal entry'
    });
  }
};

/**
 * @desc    Create manual journal entry
 * @route   POST /api/journal-entries
 * @access  Private (OWNER, ACCOUNTANT)
 */
const createJournalEntry = async (req, res) => {
  try {
    const { entryDate, description, entries, reference } = req.body;

    if (!description || !entries || entries.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Description and at least 2 entries are required'
      });
    }

    // Validate entries format
    for (const entry of entries) {
      if (!entry.accountId || (entry.debit === undefined && entry.credit === undefined)) {
        return res.status(400).json({
          success: false,
          error: 'Each entry must have accountId and either debit or credit'
        });
      }
    }

    const result = await AccountingEngine.createJournalEntry({
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      description,
      entries,
      entryType: 'MANUAL',
      reference,
      tenantId: req.user.tenantId,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      data: result.journalEntry,
      ledgerEntries: result.ledgerEntries
    });
  } catch (error) {
    logger.error('Create journal entry error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Server error creating journal entry'
    });
  }
};

/**
 * @desc    Reverse journal entry
 * @route   POST /api/journal-entries/:id/reverse
 * @access  Private (OWNER, ACCOUNTANT)
 */
const reverseJournalEntry = async (req, res) => {
  try {
    const result = await AccountingEngine.reverseJournalEntry(
      req.params.id,
      req.user._id
    );

    res.status(201).json({
      success: true,
      data: result.journalEntry,
      message: 'Journal entry reversed successfully'
    });
  } catch (error) {
    logger.error('Reverse journal entry error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Server error reversing journal entry'
    });
  }
};

/**
 * @desc    Get trial balance
 * @route   GET /api/journal-entries/trial-balance
 * @access  Private
 */
const getTrialBalance = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const date = asOfDate ? new Date(asOfDate) : new Date();

    const ChartOfAccount = require('../models/ChartOfAccount');
    const accounts = await ChartOfAccount.find({
      ...req.tenantQuery(),
      isActive: true
    }).sort({ code: 1 });

    const trialBalance = [];

    for (const account of accounts) {
      const balance = await AccountingEngine.getAccountBalance(account._id, date);
      
      trialBalance.push({
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        debit: account.normalBalance === 'DEBIT' ? Math.max(0, balance) : 0,
        credit: account.normalBalance === 'CREDIT' ? Math.max(0, balance) : 0,
        balance
      });
    }

    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

    res.status(200).json({
      success: true,
      data: {
        asOfDate: date,
        accounts: trialBalance,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          difference: totalDebits - totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      }
    });
  } catch (error) {
    logger.error('Get trial balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting trial balance'
    });
  }
};

module.exports = {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  reverseJournalEntry,
  getTrialBalance
};

