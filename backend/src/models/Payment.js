const mongoose = require('mongoose');

/**
 * Payment Schema
 * Tracks payments against invoices with support for partial payments
 */
const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice ID is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now,
    index: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: [
      'CASH',
      'CHECK',
      'BANK_TRANSFER',
      'CREDIT_CARD',
      'DEBIT_CARD',
      'ONLINE',
      'STRIPE',
      'PAYPAL',
      'WIPAY',
      'LYNK',
      'NCB',
      'JN',
      'OTHER'
    ],
    default: 'CASH'
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  // For online payments
  transactionId: {
    type: String,
    trim: true
  },
  gatewayResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Partial payment tracking
  isPartial: {
    type: Boolean,
    default: false
  },
  remainingBalance: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'COMPLETED'
  },
  // Refund tracking
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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
paymentSchema.index({ tenantId: 1, paymentDate: -1 });
paymentSchema.index({ tenantId: 1, invoiceId: 1 });
paymentSchema.index({ tenantId: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });

// Pre-save middleware
paymentSchema.pre('save', async function(next) {
  try {
    // Generate payment number if not provided
    if (!this.paymentNumber) {
      const Tenant = require('./Tenant');
      const tenant = await Tenant.findById(this.tenantId);
      const prefix = tenant?.settings?.paymentPrefix || 'PAY';
      
      const count = await mongoose.model('Payment').countDocuments({ tenantId: this.tenantId });
      const nextNumber = count + 1;
      
      this.paymentNumber = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    }
    
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if payment can be refunded
paymentSchema.methods.canRefund = function() {
  return this.status === 'COMPLETED' && this.refundedAmount < this.amount;
};

module.exports = mongoose.model('Payment', paymentSchema);

