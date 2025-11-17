const mongoose = require('mongoose');

/**
 * Fixed Asset Schema
 * Tracks fixed assets and their depreciation
 */
const fixedAssetSchema = new mongoose.Schema({
  assetNumber: {
    type: String,
    required: [true, 'Asset number is required'],
    trim: true,
    uppercase: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [200, 'Asset name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'BUILDING',
      'VEHICLE',
      'EQUIPMENT',
      'FURNITURE',
      'COMPUTER',
      'SOFTWARE',
      'MACHINERY',
      'OTHER'
    ],
    index: true
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  purchaseCost: {
    type: Number,
    required: [true, 'Purchase cost is required'],
    min: [0, 'Purchase cost must be positive']
  },
  currentValue: {
    type: Number,
    default: 0,
    min: [0, 'Current value must be positive']
  },
  depreciationMethod: {
    type: String,
    required: true,
    enum: ['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION', 'NONE'],
    default: 'STRAIGHT_LINE'
  },
  usefulLife: {
    type: Number,
    required: true,
    min: [1, 'Useful life must be at least 1 year'],
    default: 5 // years
  },
  depreciationRate: {
    type: Number,
    min: [0, 'Depreciation rate must be positive'],
    max: [100, 'Depreciation rate cannot exceed 100%'],
    default: 20 // percentage for straight line
  },
  accumulatedDepreciation: {
    type: Number,
    default: 0,
    min: [0, 'Accumulated depreciation cannot be negative']
  },
  netBookValue: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISPOSED', 'SOLD', 'SCRAPPED'],
    default: 'ACTIVE',
    index: true
  },
  disposalDate: {
    type: Date
  },
  disposalAmount: {
    type: Number,
    min: [0, 'Disposal amount must be positive']
  },
  disposalGainLoss: {
    type: Number
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount',
    required: [true, 'Asset account is required']
  },
  depreciationExpenseAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount'
  },
  accumulatedDepreciationAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastDepreciationDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate net book value before saving
fixedAssetSchema.pre('save', function(next) {
  this.netBookValue = this.purchaseCost - this.accumulatedDepreciation;
  if (this.netBookValue < 0) {
    this.netBookValue = 0;
  }
  next();
});

// Indexes
fixedAssetSchema.index({ tenantId: 1, status: 1 });
fixedAssetSchema.index({ tenantId: 1, category: 1 });
fixedAssetSchema.index({ tenantId: 1, purchaseDate: 1 });

module.exports = mongoose.model('FixedAsset', fixedAssetSchema);

