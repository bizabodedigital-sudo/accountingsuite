const mongoose = require('mongoose');

/**
 * Chart of Accounts Schema
 * Supports full double-entry accounting with Jamaican business structure
 */
const chartOfAccountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Account code is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Account code cannot exceed 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [200, 'Account name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Account type is required'],
    enum: [
      'ASSET',           // Current Assets, Fixed Assets, etc.
      'LIABILITY',       // Current Liabilities, Long-term Liabilities
      'EQUITY',          // Owner's Equity, Retained Earnings
      'REVENUE',         // Sales, Service Revenue, Other Income
      'EXPENSE'          // Cost of Goods Sold, Operating Expenses
    ],
    index: true
  },
  category: {
    type: String,
    trim: true,
    // Examples: Current Assets, Fixed Assets, Accounts Payable, etc.
  },
  parentAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount',
    default: null
  },
  isSystemAccount: {
    type: Boolean,
    default: false // System accounts cannot be deleted
  },
  isActive: {
    type: Boolean,
    default: true
  },
  normalBalance: {
    type: String,
    required: true,
    enum: ['DEBIT', 'CREDIT'],
    // ASSET, EXPENSE = DEBIT normal balance
    // LIABILITY, EQUITY, REVENUE = CREDIT normal balance
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Jamaican-specific fields
  gctAccount: {
    type: Boolean,
    default: false // Is this a GCT-related account?
  },
  taxCategory: {
    type: String,
    enum: ['STANDARD', 'ZERO', 'EXEMPT', 'NONE'],
    default: 'NONE'
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
chartOfAccountSchema.index({ tenantId: 1, code: 1 }, { unique: true });
chartOfAccountSchema.index({ tenantId: 1, type: 1 });
chartOfAccountSchema.index({ tenantId: 1, isActive: 1 });
chartOfAccountSchema.index({ tenantId: 1, parentAccountId: 1 });

// Virtual for child accounts
chartOfAccountSchema.virtual('childAccounts', {
  ref: 'ChartOfAccount',
  localField: '_id',
  foreignField: 'parentAccountId'
});

// Pre-save middleware to set normal balance based on type
chartOfAccountSchema.pre('save', function(next) {
  if (!this.normalBalance) {
    if (this.type === 'ASSET' || this.type === 'EXPENSE') {
      this.normalBalance = 'DEBIT';
    } else {
      this.normalBalance = 'CREDIT';
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Instance method to update balance
chartOfAccountSchema.methods.updateBalance = async function(debitAmount, creditAmount) {
  if (this.normalBalance === 'DEBIT') {
    this.currentBalance = (this.currentBalance || 0) + debitAmount - creditAmount;
  } else {
    this.currentBalance = (this.currentBalance || 0) + creditAmount - debitAmount;
  }
  await this.save();
};

// Static method to get default Jamaican COA
chartOfAccountSchema.statics.getDefaultJamaicanCOA = function(tenantId, userId) {
  return [
    // ASSETS
    { code: '1000', name: 'Current Assets', type: 'ASSET', category: 'Current Assets', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '1010', name: 'Cash', type: 'ASSET', category: 'Current Assets', parentCode: '1000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '1020', name: 'Bank Account', type: 'ASSET', category: 'Current Assets', parentCode: '1000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '1030', name: 'Accounts Receivable', type: 'ASSET', category: 'Current Assets', parentCode: '1000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '1040', name: 'Inventory', type: 'ASSET', category: 'Current Assets', parentCode: '1000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '1050', name: 'Prepaid Expenses', type: 'ASSET', category: 'Current Assets', parentCode: '1000', isSystemAccount: true, tenantId, createdBy: userId },
    
    { code: '2000', name: 'Fixed Assets', type: 'ASSET', category: 'Fixed Assets', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '2010', name: 'Equipment', type: 'ASSET', category: 'Fixed Assets', parentCode: '2000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '2020', name: 'Vehicles', type: 'ASSET', category: 'Fixed Assets', parentCode: '2000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '2030', name: 'Accumulated Depreciation', type: 'ASSET', category: 'Fixed Assets', parentCode: '2000', normalBalance: 'CREDIT', isSystemAccount: true, tenantId, createdBy: userId },
    
    // LIABILITIES
    { code: '3000', name: 'Current Liabilities', type: 'LIABILITY', category: 'Current Liabilities', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '3010', name: 'Accounts Payable', type: 'LIABILITY', category: 'Current Liabilities', parentCode: '3000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '3020', name: 'GCT Payable', type: 'LIABILITY', category: 'Current Liabilities', parentCode: '3000', gctAccount: true, isSystemAccount: true, tenantId, createdBy: userId },
    { code: '3030', name: 'Accrued Expenses', type: 'LIABILITY', category: 'Current Liabilities', parentCode: '3000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '3040', name: 'Short-term Loans', type: 'LIABILITY', category: 'Current Liabilities', parentCode: '3000', isSystemAccount: true, tenantId, createdBy: userId },
    
    { code: '4000', name: 'Long-term Liabilities', type: 'LIABILITY', category: 'Long-term Liabilities', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '4010', name: 'Long-term Loans', type: 'LIABILITY', category: 'Long-term Liabilities', parentCode: '4000', isSystemAccount: true, tenantId, createdBy: userId },
    
    // EQUITY
    { code: '5000', name: 'Equity', type: 'EQUITY', category: 'Equity', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '5010', name: 'Owner\'s Capital', type: 'EQUITY', category: 'Equity', parentCode: '5000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '5020', name: 'Retained Earnings', type: 'EQUITY', category: 'Equity', parentCode: '5000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '5030', name: 'Current Year Earnings', type: 'EQUITY', category: 'Equity', parentCode: '5000', isSystemAccount: true, tenantId, createdBy: userId },
    
    // REVENUE
    { code: '6000', name: 'Revenue', type: 'REVENUE', category: 'Revenue', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '6010', name: 'Sales Revenue', type: 'REVENUE', category: 'Revenue', parentCode: '6000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '6020', name: 'Service Revenue', type: 'REVENUE', category: 'Revenue', parentCode: '6000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '6030', name: 'Other Income', type: 'REVENUE', category: 'Revenue', parentCode: '6000', isSystemAccount: true, tenantId, createdBy: userId },
    
    // EXPENSES
    { code: '7000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'COGS', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '7010', name: 'Cost of Sales', type: 'EXPENSE', category: 'COGS', parentCode: '7000', isSystemAccount: true, tenantId, createdBy: userId },
    
    { code: '8000', name: 'Operating Expenses', type: 'EXPENSE', category: 'Operating Expenses', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8010', name: 'Rent Expense', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8020', name: 'Utilities Expense', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8030', name: 'Salaries & Wages', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8040', name: 'Marketing Expense', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8050', name: 'Office Supplies', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8060', name: 'Professional Services', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8070', name: 'Travel Expense', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8080', name: 'Depreciation Expense', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId },
    { code: '8090', name: 'Other Expenses', type: 'EXPENSE', category: 'Operating Expenses', parentCode: '8000', isSystemAccount: true, tenantId, createdBy: userId }
  ];
};

module.exports = mongoose.model('ChartOfAccount', chartOfAccountSchema);

