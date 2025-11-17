const mongoose = require('mongoose');

/**
 * Ledger Entry Schema
 * Represents individual debit/credit entries in the general ledger
 * Every financial transaction creates at least 2 ledger entries (double-entry)
 */
const ledgerEntrySchema = new mongoose.Schema({
  journalEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: [true, 'Journal entry ID is required'],
    index: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccount',
    required: [true, 'Account ID is required'],
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
  entryType: {
    type: String,
    required: true,
    enum: ['DEBIT', 'CREDIT']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be greater than or equal to 0']
  },
  // Reference to source document
  sourceDocument: {
    type: {
      type: String,
      enum: ['INVOICE', 'EXPENSE', 'PAYMENT', 'JOURNAL_ENTRY', 'OPENING_BALANCE', 'DEPRECIATION', 'INVENTORY', 'OTHER']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    },
    number: String // Invoice number, expense ID, etc.
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    index: true
  },
  // For period locking
  period: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    }
  },
  // Reconciliation fields
  isReconciled: {
    type: Boolean,
    default: false
  },
  reconciledDate: {
    type: Date
  },
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ledgerEntrySchema.index({ tenantId: 1, transactionDate: -1 });
ledgerEntrySchema.index({ tenantId: 1, accountId: 1, transactionDate: -1 });
ledgerEntrySchema.index({ tenantId: 1, period: 1 });
ledgerEntrySchema.index({ tenantId: 1, 'sourceDocument.type': 1, 'sourceDocument.id': 1 });
ledgerEntrySchema.index({ tenantId: 1, isReconciled: 1 });

// Virtual for account balance at this point
ledgerEntrySchema.virtual('runningBalance').get(function() {
  // This would be calculated via aggregation pipeline
  return null;
});

// Pre-save middleware to set period from transaction date
ledgerEntrySchema.pre('save', function(next) {
  if (this.transactionDate && !this.period) {
    this.period = {
      year: this.transactionDate.getFullYear(),
      month: this.transactionDate.getMonth() + 1
    };
  }
  next();
});

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);

