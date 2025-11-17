const BankRule = require('../models/BankRule');
const BankTransaction = require('../models/BankTransaction');
const logger = require('../config/logger');
const eventEmitter = require('../services/eventEmitter');

/**
 * @desc    Get all bank rules
 * @route   GET /api/bank-rules
 * @access  Private
 */
const getBankRules = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    
    const query = req.tenantQuery({
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    });

    const rules = await BankRule.find(query)
      .populate('actions.accountId', 'code name')
      .populate('createdBy', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BankRule.countDocuments(query);

    res.status(200).json({
      success: true,
      data: rules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get bank rules error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting bank rules'
    });
  }
};

/**
 * @desc    Get single bank rule
 * @route   GET /api/bank-rules/:id
 * @access  Private
 */
const getBankRule = async (req, res) => {
  try {
    const rule = await BankRule.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('actions.accountId', 'code name')
      .populate('createdBy', 'firstName lastName');

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Bank rule not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Get bank rule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting bank rule'
    });
  }
};

/**
 * @desc    Create bank rule
 * @route   POST /api/bank-rules
 * @access  Private (OWNER, ACCOUNTANT)
 */
const createBankRule = async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const rule = await BankRule.create(ruleData);

    const populatedRule = await BankRule.findById(rule._id)
      .populate('actions.accountId', 'code name')
      .populate('createdBy', 'firstName lastName');

    eventEmitter.emitEvent('bank-rule.created', populatedRule.toObject(), req.user.tenantId);

    res.status(201).json({
      success: true,
      data: populatedRule
    });
  } catch (error) {
    logger.error('Create bank rule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating bank rule'
    });
  }
};

/**
 * @desc    Update bank rule
 * @route   PUT /api/bank-rules/:id
 * @access  Private (OWNER, ACCOUNTANT)
 */
const updateBankRule = async (req, res) => {
  try {
    const rule = await BankRule.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('actions.accountId', 'code name')
      .populate('createdBy', 'firstName lastName');

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Bank rule not found'
      });
    }

    eventEmitter.emitEvent('bank-rule.updated', rule.toObject(), req.user.tenantId);

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Update bank rule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating bank rule'
    });
  }
};

/**
 * @desc    Delete bank rule
 * @route   DELETE /api/bank-rules/:id
 * @access  Private (OWNER, ACCOUNTANT)
 */
const deleteBankRule = async (req, res) => {
  try {
    const rule = await BankRule.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Bank rule not found'
      });
    }

    eventEmitter.emitEvent('bank-rule.deleted', { id: rule._id, name: rule.name }, req.user.tenantId);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete bank rule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting bank rule'
    });
  }
};

/**
 * @desc    Test bank rule against transactions
 * @route   POST /api/bank-rules/:id/test
 * @access  Private
 */
const testBankRule = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    
    const rule = await BankRule.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Bank rule not found'
      });
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction IDs are required'
      });
    }

    const transactions = await BankTransaction.find({
      _id: { $in: transactionIds },
      ...req.tenantQuery()
    });

    const results = transactions.map(trans => {
      const matches = rule.matches(trans.toObject());
      return {
        transactionId: trans._id,
        description: trans.description,
        amount: trans.amount,
        matches,
        applied: matches ? rule.apply(trans.toObject()) : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        rule: {
          id: rule._id,
          name: rule.name
        },
        results
      }
    });
  } catch (error) {
    logger.error('Test bank rule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error testing bank rule'
    });
  }
};

/**
 * @desc    Apply bank rules to transactions
 * @route   POST /api/bank-rules/apply
 * @access  Private (OWNER, ACCOUNTANT)
 */
const applyBankRules = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction IDs are required'
      });
    }

    // Get all active rules ordered by priority
    const rules = await BankRule.find({
      ...req.tenantQuery(),
      isActive: true
    }).sort({ priority: -1 }).populate('actions.accountId');

    const transactions = await BankTransaction.find({
      _id: { $in: transactionIds },
      ...req.tenantQuery()
    });

    const results = [];
    let appliedCount = 0;

    for (const transaction of transactions) {
      let updated = false;
      const transObj = transaction.toObject();

      // Apply first matching rule
      for (const rule of rules) {
        if (rule.matches(transObj)) {
          const applied = rule.apply(transObj);
          
          // Update transaction
          if (applied.accountId) {
            transaction.accountId = applied.accountId;
          }
          if (applied.category) {
            transaction.category = applied.category;
          }
          if (applied.tags) {
            transaction.tags = applied.tags;
          }
          if (applied.description) {
            transaction.description = applied.description;
          }
          
          await transaction.save();
          await rule.save(); // Save rule stats
          
          results.push({
            transactionId: transaction._id,
            ruleId: rule._id,
            ruleName: rule.name,
            applied: true
          });
          
          updated = true;
          appliedCount++;
          break; // Only apply first matching rule
        }
      }

      if (!updated) {
        results.push({
          transactionId: transaction._id,
          applied: false,
          reason: 'No matching rule found'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Applied rules to ${appliedCount} of ${transactions.length} transactions`,
      data: {
        applied: appliedCount,
        total: transactions.length,
        results
      }
    });
  } catch (error) {
    logger.error('Apply bank rules error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error applying bank rules'
    });
  }
};

module.exports = {
  getBankRules,
  getBankRule,
  createBankRule,
  updateBankRule,
  deleteBankRule,
  testBankRule,
  applyBankRules
};

