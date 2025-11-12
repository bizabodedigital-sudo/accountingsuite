const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const logger = require('../config/logger');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, vendorId, startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      ...(category && { category }),
      ...(vendorId && { vendorId }),
      ...(startDate && endDate && {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    });

    const expenses = await Expense.find(query)
      .populate('vendorId', 'name email')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting expenses'
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('vendorId', 'name email phone address')
      .populate('createdBy', 'firstName lastName');

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    logger.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting expense'
    });
  }
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    // Verify vendor exists and belongs to tenant
    const vendor = await Customer.findOne({
      _id: req.body.vendorId,
      ...req.tenantQuery()
    });

    if (!vendor) {
      return res.status(400).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const expenseData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const expense = await Expense.create(expenseData);

    // Populate the created expense
    const populatedExpense = await Expense.findById(expense._id)
      .populate('vendorId', 'name email')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedExpense
    });
  } catch (error) {
    logger.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating expense'
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('vendorId', 'name email')
      .populate('createdBy', 'firstName lastName');

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    logger.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating expense'
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting expense'
    });
  }
};

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = req.tenantQuery({
      ...(startDate && endDate && {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    });

    const summary = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          categories: {
            $push: {
              category: '$category',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Group by category
    const categorySummary = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || { totalAmount: 0, totalCount: 0, averageAmount: 0 },
        categorySummary
      }
    });
  } catch (error) {
    logger.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting expense summary'
    });
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};











