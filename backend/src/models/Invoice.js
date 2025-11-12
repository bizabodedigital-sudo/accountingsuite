const mongoose = require('mongoose');

// Function to generate unique invoice number
const generateInvoiceNumber = async (tenantId) => {
  const Tenant = require('./Tenant');
  
  try {
    // Get tenant settings for invoice prefix
    const tenant = await Tenant.findById(tenantId);
    const prefix = tenant?.settings?.invoicePrefix || 'INV';
    
    // Use a more robust approach to find the next number
    const count = await mongoose.model('Invoice').countDocuments({ tenantId });
    const nextNumber = count + 1;
    
    // Format with leading zeros (e.g., "INV-001")
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    // Fallback to timestamp-based number
    return `INV-${Date.now().toString().slice(-6)}`;
  }
};

const invoiceItemSchema = new mongoose.Schema({
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

const invoiceSchema = new mongoose.Schema({
  number: {
    type: String,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    required: [true, 'Invoice type is required'],
    enum: ['INVOICE', 'CREDIT_NOTE', 'QUOTE', 'PURCHASE_ORDER'],
    default: 'INVOICE'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be greater than or equal to 0']
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
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total must be greater than or equal to 0']
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
    default: 'DRAFT'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  paidDate: {
    type: Date
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
invoiceSchema.index({ number: 1 });
invoiceSchema.index({ customerId: 1, tenantId: 1 });
invoiceSchema.index({ status: 1, tenantId: 1 });
invoiceSchema.index({ issueDate: 1, tenantId: 1 });
invoiceSchema.index({ dueDate: 1, tenantId: 1 });
invoiceSchema.index({ tenantId: 1 });

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'OVERDUE' && this.dueDate < new Date()) {
    return Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware to generate invoice number and calculate totals
invoiceSchema.pre('save', async function(next) {
  try {
    // Generate invoice number if not provided
    if (!this.number) {
      this.number = await generateInvoiceNumber(this.tenantId);
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
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update status based on due date
invoiceSchema.pre('save', function(next) {
  if (this.status === 'SENT' && this.dueDate < new Date() && !this.paidDate) {
    this.status = 'OVERDUE';
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);




