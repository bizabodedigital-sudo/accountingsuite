const FixedAsset = require('../models/FixedAsset');
const ChartOfAccount = require('../models/ChartOfAccount');
const AccountingEngine = require('../services/accountingEngine');
const logger = require('../config/logger');

/**
 * @desc    Get all fixed assets
 * @route   GET /api/fixed-assets
 * @access  Private
 */
const getFixedAssets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const query = req.tenantQuery();

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await FixedAsset.find(query)
      .populate('accountId', 'code name')
      .populate('depreciationExpenseAccountId', 'code name')
      .populate('accumulatedDepreciationAccountId', 'code name')
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FixedAsset.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get fixed assets error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching fixed assets'
    });
  }
};

/**
 * @desc    Get single fixed asset
 * @route   GET /api/fixed-assets/:id
 * @access  Private
 */
const getFixedAsset = async (req, res) => {
  try {
    const asset = await FixedAsset.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('accountId', 'code name')
      .populate('depreciationExpenseAccountId', 'code name')
      .populate('accumulatedDepreciationAccountId', 'code name');

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    logger.error('Get fixed asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching fixed asset'
    });
  }
};

/**
 * @desc    Create fixed asset
 * @route   POST /api/fixed-assets
 * @access  Private
 */
const createFixedAsset = async (req, res) => {
  try {
    const assetData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
      currentValue: req.body.purchaseCost,
      netBookValue: req.body.purchaseCost
    };

    const asset = await FixedAsset.create(assetData);

    // Create journal entry for asset purchase
    if (asset.accountId) {
      try {
        await AccountingEngine.createJournalEntry({
          tenantId: req.user.tenantId,
          entryDate: asset.purchaseDate,
          description: `Asset Purchase: ${asset.name}`,
          lines: [
            {
              accountId: asset.accountId,
              entryType: 'DEBIT',
              amount: asset.purchaseCost,
              description: `Purchase of ${asset.name}`
            },
            {
              accountId: req.body.paymentAccountId, // Bank or Cash account
              entryType: 'CREDIT',
              amount: asset.purchaseCost,
              description: `Payment for ${asset.name}`
            }
          ],
          sourceDocument: {
            type: 'FIXED_ASSET',
            id: asset._id
          }
        });
      } catch (accountingError) {
        logger.error('Failed to create journal entry for asset:', accountingError);
        // Don't fail the asset creation if accounting fails
      }
    }

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    logger.error('Create fixed asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error creating fixed asset'
    });
  }
};

/**
 * @desc    Update fixed asset
 * @route   PUT /api/fixed-assets/:id
 * @access  Private
 */
const updateFixedAsset = async (req, res) => {
  try {
    const asset = await FixedAsset.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantQuery()
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    logger.error('Update fixed asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error updating fixed asset'
    });
  }
};

/**
 * @desc    Delete fixed asset
 * @route   DELETE /api/fixed-assets/:id
 * @access  Private
 */
const deleteFixedAsset = async (req, res) => {
  try {
    const asset = await FixedAsset.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fixed asset deleted successfully'
    });
  } catch (error) {
    logger.error('Delete fixed asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting fixed asset'
    });
  }
};

/**
 * @desc    Calculate depreciation for asset
 * @route   POST /api/fixed-assets/:id/calculate-depreciation
 * @access  Private
 */
const calculateDepreciation = async (req, res) => {
  try {
    const { asOfDate } = req.body;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();

    const asset = await FixedAsset.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    if (asset.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Cannot calculate depreciation for disposed assets'
      });
    }

    let depreciationAmount = 0;
    const monthsSincePurchase = Math.floor((asOf - asset.purchaseDate) / (1000 * 60 * 60 * 24 * 30));
    const monthsSinceLastDepreciation = asset.lastDepreciationDate
      ? Math.floor((asOf - asset.lastDepreciationDate) / (1000 * 60 * 60 * 24 * 30))
      : monthsSincePurchase;

    if (asset.depreciationMethod === 'STRAIGHT_LINE') {
      const monthlyDepreciation = asset.purchaseCost / (asset.usefulLife * 12);
      depreciationAmount = monthlyDepreciation * monthsSinceLastDepreciation;
    } else if (asset.depreciationMethod === 'DECLINING_BALANCE') {
      const annualRate = asset.depreciationRate / 100;
      const monthlyRate = annualRate / 12;
      let bookValue = asset.netBookValue || asset.purchaseCost;
      
      for (let i = 0; i < monthsSinceLastDepreciation; i++) {
        const monthlyDep = bookValue * monthlyRate;
        depreciationAmount += monthlyDep;
        bookValue -= monthlyDep;
      }
    }

    // Don't depreciate below zero
    const maxDepreciation = asset.netBookValue || asset.purchaseCost;
    depreciationAmount = Math.min(depreciationAmount, maxDepreciation);

    res.status(200).json({
      success: true,
      data: {
        assetId: asset._id,
        assetName: asset.name,
        currentBookValue: asset.netBookValue,
        depreciationAmount,
        newBookValue: asset.netBookValue - depreciationAmount,
        monthsSinceLastDepreciation,
        asOfDate: asOf
      }
    });
  } catch (error) {
    logger.error('Calculate depreciation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error calculating depreciation'
    });
  }
};

/**
 * @desc    Post depreciation entry
 * @route   POST /api/fixed-assets/:id/post-depreciation
 * @access  Private
 */
const postDepreciation = async (req, res) => {
  try {
    const { asOfDate, amount } = req.body;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();

    const asset = await FixedAsset.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    if (!asset.depreciationExpenseAccountId || !asset.accumulatedDepreciationAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Depreciation accounts not configured for this asset'
      });
    }

    // Update asset
    asset.accumulatedDepreciation += amount;
    asset.lastDepreciationDate = asOf;
    await asset.save();

    // Create journal entry
    await AccountingEngine.createJournalEntry({
      tenantId: req.user.tenantId,
      entryDate: asOf,
      description: `Depreciation: ${asset.name}`,
      lines: [
        {
          accountId: asset.depreciationExpenseAccountId,
          entryType: 'DEBIT',
          amount: amount,
          description: `Depreciation expense for ${asset.name}`
        },
        {
          accountId: asset.accumulatedDepreciationAccountId,
          entryType: 'CREDIT',
          amount: amount,
          description: `Accumulated depreciation for ${asset.name}`
        }
      ],
      sourceDocument: {
        type: 'DEPRECIATION',
        id: asset._id
      }
    });

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    logger.error('Post depreciation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error posting depreciation'
    });
  }
};

/**
 * @desc    Dispose asset
 * @route   POST /api/fixed-assets/:id/dispose
 * @access  Private
 */
const disposeAsset = async (req, res) => {
  try {
    const { disposalDate, disposalAmount, disposalMethod } = req.body;

    const asset = await FixedAsset.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    const gainLoss = (disposalAmount || 0) - asset.netBookValue;

    asset.status = disposalMethod || 'DISPOSED';
    asset.disposalDate = disposalDate ? new Date(disposalDate) : new Date();
    asset.disposalAmount = disposalAmount || 0;
    asset.disposalGainLoss = gainLoss;
    await asset.save();

    // Create journal entry for disposal
    if (asset.accountId) {
      await AccountingEngine.createJournalEntry({
        tenantId: req.user.tenantId,
        entryDate: asset.disposalDate,
        description: `Asset Disposal: ${asset.name}`,
        lines: [
          {
            accountId: asset.accumulatedDepreciationAccountId,
            entryType: 'DEBIT',
            amount: asset.accumulatedDepreciation,
            description: `Remove accumulated depreciation for ${asset.name}`
          },
          {
            accountId: req.body.disposalAccountId, // Bank or Cash account
            entryType: 'DEBIT',
            amount: disposalAmount || 0,
            description: `Proceeds from disposal of ${asset.name}`
          },
          {
            accountId: asset.accountId,
            entryType: 'CREDIT',
            amount: asset.purchaseCost,
            description: `Remove asset ${asset.name}`
          },
          ...(gainLoss !== 0 ? [{
            accountId: req.body.gainLossAccountId, // Gain/Loss account
            entryType: gainLoss > 0 ? 'CREDIT' : 'DEBIT',
            amount: Math.abs(gainLoss),
            description: `${gainLoss > 0 ? 'Gain' : 'Loss'} on disposal of ${asset.name}`
          }] : [])
        ],
        sourceDocument: {
          type: 'FIXED_ASSET',
          id: asset._id
        }
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    logger.error('Dispose asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error disposing asset'
    });
  }
};

/**
 * @desc    Get depreciation schedule
 * @route   GET /api/fixed-assets/:id/depreciation-schedule
 * @access  Private
 */
const getDepreciationSchedule = async (req, res) => {
  try {
    const asset = await FixedAsset.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Fixed asset not found'
      });
    }

    const schedule = [];
    const monthlyDepreciation = asset.depreciationMethod === 'STRAIGHT_LINE'
      ? asset.purchaseCost / (asset.usefulLife * 12)
      : 0;

    let bookValue = asset.purchaseCost;
    let accumulatedDep = 0;

    for (let month = 0; month < asset.usefulLife * 12; month++) {
      const date = new Date(asset.purchaseDate);
      date.setMonth(date.getMonth() + month);

      let monthlyDep = 0;
      if (asset.depreciationMethod === 'STRAIGHT_LINE') {
        monthlyDep = monthlyDepreciation;
      } else if (asset.depreciationMethod === 'DECLINING_BALANCE') {
        const monthlyRate = (asset.depreciationRate / 100) / 12;
        monthlyDep = bookValue * monthlyRate;
      }

      accumulatedDep += monthlyDep;
      bookValue -= monthlyDep;

      if (bookValue < 0) bookValue = 0;

      schedule.push({
        period: month + 1,
        date: date.toISOString().split('T')[0],
        depreciation: monthlyDep,
        accumulatedDepreciation: accumulatedDep,
        bookValue: bookValue
      });
    }

    res.status(200).json({
      success: true,
      data: {
        asset: {
          id: asset._id,
          name: asset.name,
          purchaseCost: asset.purchaseCost,
          usefulLife: asset.usefulLife,
          depreciationMethod: asset.depreciationMethod
        },
        schedule
      }
    });
  } catch (error) {
    logger.error('Get depreciation schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating depreciation schedule'
    });
  }
};

module.exports = {
  getFixedAssets,
  getFixedAsset,
  createFixedAsset,
  updateFixedAsset,
  deleteFixedAsset,
  calculateDepreciation,
  postDepreciation,
  disposeAsset,
  getDepreciationSchedule
};

