const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'OFFICE_SUPPLIES',
      'UTILITIES',
      'RENT',
      'INSURANCE',
      'MARKETING',
      'TRAVEL',
      'MEALS',
      'EQUIPMENT',
      'PROFESSIONAL_SERVICES',
      'OTHER'
    ],
    default: 'OTHER'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Using Customer model for vendors too
    required: [true, 'Vendor ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  receipt: {
    filename: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  isReimbursable: {
    type: Boolean,
    default: false
  },
  isTaxDeductible: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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
expenseSchema.index({ date: 1, tenantId: 1 });
expenseSchema.index({ category: 1, tenantId: 1 });
expenseSchema.index({ vendorId: 1, tenantId: 1 });
expenseSchema.index({ tenantId: 1 });
expenseSchema.index({ createdBy: 1, tenantId: 1 });

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);

















