const mongoose = require('mongoose');

/**
 * Journal Entry Schema
 * Represents a complete double-entry transaction
 * Every journal entry must have balanced debits and credits
 */
const journalEntrySchema = new mongoose.Schema({
  entryNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true
  },
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required'],
    default: Date.now,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  // Total debits and credits (must be equal)
  totalDebits: {
    type: Number,
    required: true,
    min: [0, 'Total debits must be greater than or equal to 0']
  },
  totalCredits: {
    type: Number,
    required: true,
    min: [0, 'Total credits must be greater than or equal to 0']
  },
  isBalanced: {
    type: Boolean,
    default: false
  },
  // Entry type
  entryType: {
    type: String,
    enum: [
      'MANUAL',           // Manual journal entry
      'INVOICE',          // Auto-generated from invoice
      'EXPENSE',          // Auto-generated from expense
      'PAYMENT',          // Auto-generated from payment
      'OPENING_BALANCE',  // Opening balance entry
      'ADJUSTMENT',       // Adjusting entry
      'DEPRECIATION',     // Depreciation entry
      'CLOSING',          // Closing entry
      'REVERSAL',         // Reversing entry
      'INVENTORY',        // Inventory adjustment
      'OTHER'
    ],
    default: 'MANUAL'
  },
  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'POSTED', 'VOIDED'],
    default: 'DRAFT'
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
  // Reversal tracking
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  isReversal: {
    type: Boolean,
    default: false
  },
  originalEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  // Approval workflow
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  postedAt: {
    type: Date
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
journalEntrySchema.index({ tenantId: 1, entryDate: -1 });
journalEntrySchema.index({ tenantId: 1, entryNumber: 1 }, { unique: true });
journalEntrySchema.index({ tenantId: 1, status: 1 });
journalEntrySchema.index({ tenantId: 1, entryType: 1 });
journalEntrySchema.index({ tenantId: 1, period: 1 });

// Virtual for ledger entries
journalEntrySchema.virtual('ledgerEntries', {
  ref: 'LedgerEntry',
  localField: '_id',
  foreignField: 'journalEntryId'
});

// Pre-save middleware
journalEntrySchema.pre('save', function(next) {
  // Set period from entry date
  if (this.entryDate && !this.period) {
    this.period = {
      year: this.entryDate.getFullYear(),
      month: this.entryDate.getMonth() + 1
    };
  }
  
  // Check if balanced
  this.isBalanced = Math.abs(this.totalDebits - this.totalCredits) < 0.01;
  
  // Generate entry number if not provided
  if (!this.entryNumber) {
    this.entryNumber = `JE-${Date.now().toString().slice(-8)}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Instance method to validate balance
journalEntrySchema.methods.validateBalance = function() {
  return Math.abs(this.totalDebits - this.totalCredits) < 0.01;
};

// Static method to generate entry number
journalEntrySchema.statics.generateEntryNumber = async function(tenantId) {
  const Tenant = require('./Tenant');
  const tenant = await Tenant.findById(tenantId);
  const prefix = tenant?.settings?.journalEntryPrefix || 'JE';
  
  const count = await this.countDocuments({ tenantId });
  const nextNumber = count + 1;
  
  return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
};

module.exports = mongoose.model('JournalEntry', journalEntrySchema);

