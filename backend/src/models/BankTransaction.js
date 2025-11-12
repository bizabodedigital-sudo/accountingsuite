const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Transaction date is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: [true, 'Transaction type is required']
  },
  status: {
    type: String,
    enum: ['matched', 'unmatched', 'pending'],
    default: 'pending'
  },
  bankReference: {
    type: String,
    trim: true
  },
  accountReference: {
    type: String,
    trim: true
  },
  matchedInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  matchedExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },
  statementFile: {
    key: {
      type: String,
      trim: true
    },
    originalName: {
      type: String,
      trim: true
    }
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user ID is required']
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
bankTransactionSchema.index({ tenantId: 1, date: -1 });
bankTransactionSchema.index({ tenantId: 1, status: 1 });
bankTransactionSchema.index({ tenantId: 1, bankReference: 1 });

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);

