const FinancialPeriod = require('../models/FinancialPeriod');
const JournalEntry = require('../models/JournalEntry');
const LedgerEntry = require('../models/LedgerEntry');
const logger = require('../config/logger');

/**
 * @desc    Get all financial periods
 * @route   GET /api/financial-periods
 * @access  Private
 */
const getFinancialPeriods = async (req, res) => {
  try {
    const { year, isLocked } = req.query;
    
    const query = req.tenantQuery({
      ...(year && { year: parseInt(year) }),
      ...(isLocked !== undefined && { isLocked: isLocked === 'true' })
    });

    const periods = await FinancialPeriod.find(query)
      .populate('lockedBy', 'firstName lastName')
      .populate('unlockedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: periods
    });
  } catch (error) {
    logger.error('Get financial periods error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting financial periods'
    });
  }
};

/**
 * @desc    Get single financial period
 * @route   GET /api/financial-periods/:year/:month
 * @access  Private
 */
const getFinancialPeriod = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const period = await FinancialPeriod.findOne({
      tenantId: req.user.tenantId,
      year: parseInt(year),
      month: parseInt(month)
    })
      .populate('lockedBy', 'firstName lastName')
      .populate('unlockedBy', 'firstName lastName');

    if (!period) {
      // Create period if it doesn't exist
      const newPeriod = await FinancialPeriod.getOrCreatePeriod(
        parseInt(year),
        parseInt(month),
        req.user.tenantId,
        req.user._id
      );
      return res.status(200).json({
        success: true,
        data: newPeriod
      });
    }

    res.status(200).json({
      success: true,
      data: period
    });
  } catch (error) {
    logger.error('Get financial period error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting financial period'
    });
  }
};

/**
 * @desc    Lock financial period
 * @route   POST /api/financial-periods/:year/:month/lock
 * @access  Private (OWNER, ACCOUNTANT)
 */
const lockPeriod = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const period = await FinancialPeriod.getOrCreatePeriod(
      parseInt(year),
      parseInt(month),
      req.user.tenantId,
      req.user._id
    );

    if (period.isLocked) {
      return res.status(400).json({
        success: false,
        error: 'Period is already locked'
      });
    }

    period.isLocked = true;
    period.lockedBy = req.user._id;
    period.lockedAt = new Date();
    await period.save();

    logger.info(`Period ${year}-${month} locked by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Period locked successfully',
      data: period
    });
  } catch (error) {
    logger.error('Lock period error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error locking period'
    });
  }
};

/**
 * @desc    Unlock financial period
 * @route   POST /api/financial-periods/:year/:month/unlock
 * @access  Private (OWNER only)
 */
const unlockPeriod = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { reason } = req.body;
    
    const period = await FinancialPeriod.findOne({
      tenantId: req.user.tenantId,
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Period not found'
      });
    }

    if (!period.isLocked) {
      return res.status(400).json({
        success: false,
        error: 'Period is not locked'
      });
    }

    period.isLocked = false;
    period.unlockedBy = req.user._id;
    period.unlockedAt = new Date();
    period.unlockReason = reason;
    await period.save();

    logger.info(`Period ${year}-${month} unlocked by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Period unlocked successfully',
      data: period
    });
  } catch (error) {
    logger.error('Unlock period error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error unlocking period'
    });
  }
};

/**
 * @desc    Update period summary
 * @route   POST /api/financial-periods/:year/:month/update-summary
 * @access  Private
 */
const updatePeriodSummary = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const period = await FinancialPeriod.getOrCreatePeriod(
      parseInt(year),
      parseInt(month),
      req.user.tenantId,
      req.user._id
    );

    // Calculate summary from ledger entries
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const revenueEntries = await LedgerEntry.aggregate([
      {
        $match: {
          tenantId: period.tenantId,
          transactionDate: { $gte: startDate, $lte: endDate },
          'accountId': { $in: await getRevenueAccountIds(period.tenantId) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $cond: [{ $eq: ['$entryType', 'CREDIT'] }, '$amount', { $multiply: ['$amount', -1] }] } }
        }
      }
    ]);

    const expenseEntries = await LedgerEntry.aggregate([
      {
        $match: {
          tenantId: period.tenantId,
          transactionDate: { $gte: startDate, $lte: endDate },
          'accountId': { $in: await getExpenseAccountIds(period.tenantId) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $cond: [{ $eq: ['$entryType', 'DEBIT'] }, '$amount', { $multiply: ['$amount', -1] }] } }
        }
      }
    ]);

    const journalCount = await JournalEntry.countDocuments({
      tenantId: period.tenantId,
      entryDate: { $gte: startDate, $lte: endDate }
    });

    period.totalRevenue = revenueEntries[0]?.total || 0;
    period.totalExpenses = expenseEntries[0]?.total || 0;
    period.netIncome = period.totalRevenue - period.totalExpenses;
    period.journalEntryCount = journalCount;
    period.lastUpdated = new Date();
    await period.save();

    res.status(200).json({
      success: true,
      data: period
    });
  } catch (error) {
    logger.error('Update period summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating period summary'
    });
  }
};

// Helper functions
async function getRevenueAccountIds(tenantId) {
  const ChartOfAccount = require('../models/ChartOfAccount');
  const accounts = await ChartOfAccount.find({
    tenantId,
    type: 'REVENUE',
    isActive: true
  });
  return accounts.map(a => a._id);
}

async function getExpenseAccountIds(tenantId) {
  const ChartOfAccount = require('../models/ChartOfAccount');
  const accounts = await ChartOfAccount.find({
    tenantId,
    type: 'EXPENSE',
    isActive: true
  });
  return accounts.map(a => a._id);
}

module.exports = {
  getFinancialPeriods,
  getFinancialPeriod,
  lockPeriod,
  unlockPeriod,
  updatePeriodSummary
};

