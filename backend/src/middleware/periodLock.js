const FinancialPeriod = require('../models/FinancialPeriod');
const logger = require('../config/logger');

/**
 * Middleware to check if a period is locked
 * Prevents edits to locked periods
 */
const checkPeriodLock = async (req, res, next) => {
  try {
    // Get date from request (entryDate, transactionDate, date, etc.)
    let date = null;
    
    if (req.body.entryDate) {
      date = new Date(req.body.entryDate);
    } else if (req.body.transactionDate) {
      date = new Date(req.body.transactionDate);
    } else if (req.body.date) {
      date = new Date(req.body.date);
    } else if (req.body.issueDate) {
      date = new Date(req.body.issueDate);
    } else if (req.params.year && req.params.month) {
      date = new Date(parseInt(req.params.year), parseInt(req.params.month) - 1, 1);
    }

    if (!date) {
      // If no date provided, allow the request (might be a GET request)
      return next();
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const period = await FinancialPeriod.findOne({
      tenantId: req.user.tenantId,
      year,
      month
    });

    if (period && period.isLocked) {
      // OWNER can always edit, others cannot
      if (req.user.role !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: `Period ${period.periodLabel} is locked and cannot be modified. Contact an owner to unlock.`
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Period lock check error:', error);
    // Don't block request if check fails
    next();
  }
};

module.exports = checkPeriodLock;

