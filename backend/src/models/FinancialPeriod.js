const mongoose = require('mongoose');

/**
 * Financial Period Schema
 * Tracks financial periods and their lock status
 */
const financialPeriodSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2000, 'Year must be 2000 or later'],
    max: [2100, 'Year must be 2100 or earlier'],
    index: true
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12'],
    index: true
  },
  isLocked: {
    type: Boolean,
    default: false,
    index: true
  },
  lockedAt: {
    type: Date
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unlockReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Unlock reason cannot exceed 500 characters']
  },
  unlockedAt: {
    type: Date
  },
  unlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Period summary (calculated)
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netIncome: {
    type: Number,
    default: 0
  },
  journalEntryCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index for year-month-tenant
financialPeriodSchema.index({ tenantId: 1, year: 1, month: 1 }, { unique: true });
financialPeriodSchema.index({ tenantId: 1, isLocked: 1 });

// Virtual for period label
financialPeriodSchema.virtual('periodLabel').get(function() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[this.month - 1]} ${this.year}`;
});

// Pre-save middleware
financialPeriodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isLocked && !this.lockedAt) {
    this.lockedAt = new Date();
  }
  if (!this.isLocked && this.lockedAt) {
    this.unlockedAt = new Date();
  }
  next();
});

// Static method to get or create period
financialPeriodSchema.statics.getOrCreatePeriod = async function(year, month, tenantId, userId) {
  let period = await this.findOne({
    tenantId,
    year,
    month
  });

  if (!period) {
    period = await this.create({
      year,
      month,
      tenantId,
      createdBy: userId
    });
  }

  return period;
};

// Instance method to check if period can be edited
financialPeriodSchema.methods.canEdit = function() {
  return !this.isLocked;
};

module.exports = mongoose.model('FinancialPeriod', financialPeriodSchema);

