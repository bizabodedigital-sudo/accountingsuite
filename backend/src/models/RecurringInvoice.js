const mongoose = require('mongoose');

const recurringInvoiceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Recurring invoice name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Customer Information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },

  // Invoice Items
  items: [{
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [0.01, 'Quantity must be greater than 0']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Item unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Item total is required'],
      min: [0, 'Item total cannot be negative']
    }
  }],

  // Financial Information
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 15,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax amount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },

  // Recurring Settings
  frequency: {
    type: String,
    enum: {
      values: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'],
      message: 'Invalid frequency. Must be DAILY, WEEKLY, MONTHLY, QUARTERLY, or ANNUALLY'
    },
    required: [true, 'Frequency is required']
  },
  interval: {
    type: Number,
    default: 1,
    min: [1, 'Interval must be at least 1'],
    max: [365, 'Interval cannot exceed 365']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    default: null // null means no end date (infinite)
  },
  nextRunDate: {
    type: Date,
    required: [true, 'Next run date is required']
  },
  lastRunDate: {
    type: Date,
    default: null
  },

  // Status and Control
  status: {
    type: String,
    enum: {
      values: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      message: 'Invalid status. Must be ACTIVE, PAUSED, COMPLETED, or CANCELLED'
    },
    default: 'ACTIVE'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  poNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'PO number cannot exceed 50 characters']
  },

  // Statistics
  totalGenerated: {
    type: Number,
    default: 0,
    min: [0, 'Total generated cannot be negative']
  },
  lastGeneratedInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },

  // Tenant and User Information
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
recurringInvoiceSchema.index({ tenantId: 1, status: 1 });
recurringInvoiceSchema.index({ tenantId: 1, customerId: 1 });
recurringInvoiceSchema.index({ tenantId: 1, nextRunDate: 1 });
recurringInvoiceSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for customer name
recurringInvoiceSchema.virtual('customerName', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate totals
recurringInvoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  
  // Calculate total
  this.total = this.subtotal + this.taxAmount;
  
  next();
});

// Method to calculate next run date
recurringInvoiceSchema.methods.calculateNextRunDate = function() {
  const now = new Date();
  let nextRun = new Date(this.nextRunDate || this.startDate);
  
  while (nextRun <= now) {
    switch (this.frequency) {
      case 'DAILY':
        nextRun.setDate(nextRun.getDate() + this.interval);
        break;
      case 'WEEKLY':
        nextRun.setDate(nextRun.getDate() + (7 * this.interval));
        break;
      case 'MONTHLY':
        nextRun.setMonth(nextRun.getMonth() + this.interval);
        break;
      case 'QUARTERLY':
        nextRun.setMonth(nextRun.getMonth() + (3 * this.interval));
        break;
      case 'ANNUALLY':
        nextRun.setFullYear(nextRun.getFullYear() + this.interval);
        break;
    }
  }
  
  return nextRun;
};

// Method to generate invoice from recurring template
recurringInvoiceSchema.methods.generateInvoice = async function() {
  const Invoice = mongoose.model('Invoice');
  
  const invoiceData = {
    customerId: this.customerId,
    items: this.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    })),
    subtotal: this.subtotal,
    taxRate: this.taxRate,
    taxAmount: this.taxAmount,
    total: this.total,
    status: 'DRAFT',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    issueDate: new Date(),
    notes: this.notes,
    poNumber: this.poNumber,
    tenantId: this.tenantId,
    createdBy: this.createdBy
  };
  
  const invoice = new Invoice(invoiceData);
  await invoice.save();
  
  // Update recurring invoice statistics
  this.lastRunDate = new Date();
  this.nextRunDate = this.calculateNextRunDate();
  this.totalGenerated += 1;
  this.lastGeneratedInvoiceId = invoice._id;
  
  await this.save();
  
  return invoice;
};

module.exports = mongoose.model('RecurringInvoice', recurringInvoiceSchema);








