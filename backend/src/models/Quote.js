const mongoose = require('mongoose');

/**
 * Quote/Estimate Schema
 * Similar to Invoice but with quote-specific fields
 */
const quoteItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be greater than or equal to 0']
  },
  total: {
    type: Number,
    required: true
  }
});

const quoteSchema = new mongoose.Schema({
  number: {
    type: String,
    trim: true,
    uppercase: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  items: [quoteItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be greater than or equal to 0']
  },
  taxType: {
    type: String,
    enum: ['STANDARD', 'ZERO', 'EXEMPT', 'CUSTOM'],
    default: 'STANDARD'
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate must be greater than or equal to 0'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount must be greater than or equal to 0']
  },
  customTaxRate: {
    type: Number,
    min: [0, 'Custom tax rate must be greater than or equal to 0'],
    max: [100, 'Custom tax rate cannot exceed 100%']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total must be greater than or equal to 0']
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED'],
    default: 'DRAFT'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  approvedDate: {
    type: Date
  },
  convertedToInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  terms: {
    type: String,
    trim: true,
    maxlength: [1000, 'Terms cannot exceed 1000 characters']
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
quoteSchema.index({ number: 1 });
quoteSchema.index({ customerId: 1, tenantId: 1 });
quoteSchema.index({ status: 1, tenantId: 1 });
quoteSchema.index({ issueDate: 1, tenantId: 1 });
quoteSchema.index({ expiryDate: 1, tenantId: 1 });
quoteSchema.index({ tenantId: 1 });

// Pre-save middleware to generate quote number and calculate totals
quoteSchema.pre('save', async function(next) {
  try {
    // Generate quote number if not provided
    if (!this.number) {
      const Tenant = require('./Tenant');
      const tenant = await Tenant.findById(this.tenantId);
      const prefix = tenant?.settings?.quotePrefix || 'QUO';
      
      const count = await mongoose.model('Quote').countDocuments({ tenantId: this.tenantId });
      const nextNumber = count + 1;
      
      this.number = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    }
    
    // Calculate item totals
    this.items.forEach(item => {
      item.total = item.quantity * item.unitPrice;
    });
    
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    
    // Calculate tax amount
    this.taxAmount = (this.subtotal * this.taxRate) / 100;
    
    // Calculate total
    this.total = this.subtotal + this.taxAmount;
    
    // Update timestamp
    this.updatedAt = Date.now();
    
    // Check if expired
    if (this.expiryDate && this.expiryDate < new Date() && this.status === 'SENT') {
      this.status = 'EXPIRED';
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Quote', quoteSchema);

