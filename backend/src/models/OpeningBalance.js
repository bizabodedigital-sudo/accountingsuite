const mongoose = require('mongoose');

/**
 * Opening Balance Schema
 * Tracks opening balances for accounts, customers, vendors, inventory
 */
const openingBalanceSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount',
    required: true,
    index: true
  },
  accountCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  balance: {
    type: Number,
    required: [true, 'Balance is required'],
    default: 0
  },
  asOfDate: {
    type: Date,
    required: [true, 'As of date is required'],
    index: true
  },
  // For customer/vendor opening balances
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer' // Using Customer model for vendors
  },
  // For inventory opening balances
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  inventoryQuantity: {
    type: Number,
    default: 0
  },
  inventoryValue: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isPosted: {
    type: Boolean,
    default: false
  },
  postedAt: {
    type: Date
  },
  journalEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes
openingBalanceSchema.index({ tenantId: 1, asOfDate: -1 });
openingBalanceSchema.index({ tenantId: 1, accountId: 1 });
openingBalanceSchema.index({ tenantId: 1, customerId: 1 });
openingBalanceSchema.index({ tenantId: 1, productId: 1 });

// Pre-save middleware
openingBalanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('OpeningBalance', openingBalanceSchema);

