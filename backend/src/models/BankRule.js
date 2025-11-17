const mongoose = require('mongoose');

/**
 * Bank Rule Schema
 * Rules for auto-categorizing bank transactions
 */
const bankRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Rule name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Rule conditions
  conditions: {
    // Match transaction description
    descriptionContains: {
      type: String,
      trim: true
    },
    descriptionRegex: {
      type: String,
      trim: true
    },
    // Match amount range
    amountMin: {
      type: Number
    },
    amountMax: {
      type: Number
    },
    // Match transaction type
    transactionType: {
      type: String,
      enum: ['DEBIT', 'CREDIT', 'BOTH']
    },
    // Match merchant/payee
    merchantContains: {
      type: String,
      trim: true
    }
  },
  // Actions when rule matches
  actions: {
    // Categorize to account
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccount'
    },
    // Categorize to expense category
    category: {
      type: String,
      trim: true
    },
    // Add tags
    tags: [{
      type: String,
      trim: true
    }],
    // Set description
    setDescription: {
      type: String,
      trim: true
    }
  },
  // Rule priority (higher = applied first)
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority must be greater than or equal to 0']
  },
  // Rule status
  isActive: {
    type: Boolean,
    default: true
  },
  // Statistics
  matchCount: {
    type: Number,
    default: 0
  },
  lastMatchedAt: {
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
bankRuleSchema.index({ tenantId: 1, isActive: 1, priority: -1 });
bankRuleSchema.index({ tenantId: 1, 'conditions.descriptionContains': 1 });

// Pre-save middleware
bankRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to test if a transaction matches this rule
bankRuleSchema.methods.matches = function(transaction) {
  if (!this.isActive) return false;

  const { conditions } = this;
  let matches = true;

  // Check description contains
  if (conditions.descriptionContains) {
    const desc = (transaction.description || '').toLowerCase();
    const search = conditions.descriptionContains.toLowerCase();
    if (!desc.includes(search)) {
      matches = false;
    }
  }

  // Check description regex
  if (conditions.descriptionRegex && matches) {
    try {
      const regex = new RegExp(conditions.descriptionRegex, 'i');
      if (!regex.test(transaction.description || '')) {
        matches = false;
      }
    } catch (e) {
      // Invalid regex, skip this condition
    }
  }

  // Check amount range
  if (conditions.amountMin !== undefined && matches) {
    if (transaction.amount < conditions.amountMin) {
      matches = false;
    }
  }
  if (conditions.amountMax !== undefined && matches) {
    if (transaction.amount > conditions.amountMax) {
      matches = false;
    }
  }

  // Check transaction type
  if (conditions.transactionType && matches) {
    if (conditions.transactionType !== 'BOTH') {
      const transType = transaction.amount >= 0 ? 'CREDIT' : 'DEBIT';
      if (transType !== conditions.transactionType) {
        matches = false;
      }
    }
  }

  // Check merchant
  if (conditions.merchantContains && matches) {
    const merchant = (transaction.merchant || transaction.payee || '').toLowerCase();
    const search = conditions.merchantContains.toLowerCase();
    if (!merchant.includes(search)) {
      matches = false;
    }
  }

  return matches;
};

// Instance method to apply rule actions to a transaction
bankRuleSchema.methods.apply = function(transaction) {
  const { actions } = this;
  const updated = { ...transaction };

  if (actions.accountId) {
    updated.accountId = actions.accountId;
  }

  if (actions.category) {
    updated.category = actions.category;
  }

  if (actions.tags && actions.tags.length > 0) {
    updated.tags = [...(updated.tags || []), ...actions.tags];
  }

  if (actions.setDescription) {
    updated.description = actions.setDescription;
  }

  // Update rule statistics
  this.matchCount = (this.matchCount || 0) + 1;
  this.lastMatchedAt = new Date();

  return updated;
};

module.exports = mongoose.model('BankRule', bankRuleSchema);

