const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Product description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    default: function() {
      // Auto-generate SKU if not provided
      return `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    },
    match: [/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['SERVICES', 'GOODS', 'DIGITAL', 'CONSULTING', 'SOFTWARE', 'HARDWARE', 'OTHER'],
      message: 'Invalid product category'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['NONE', 'PIECE', 'HOUR', 'DAY', 'MONTH', 'YEAR', 'KG', 'LITER', 'METER', 'SQUARE_METER', 'CUBIC_METER', 'PROJECT'],
      message: 'Invalid unit type'
    }
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  minStockLevel: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: [0, 'Maximum stock level cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isService: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: {
      values: ['NORMAL', 'CRITICAL', 'MUST_HAVE'],
      message: 'Invalid priority level'
    },
    default: 'NORMAL'
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    alt: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (this.stockQuantity <= this.minStockLevel) return 'LOW_STOCK';
  if (this.stockQuantity >= this.maxStockLevel) return 'OVERSTOCK';
  return 'IN_STOCK';
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return this.stockQuantity * this.unitPrice;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.cost === 0) return 0;
  return ((this.unitPrice - this.cost) / this.cost) * 100;
});

// Pre-save middleware to update lastModifiedBy
productSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // In a real app, this would be the current user
  }
  next();
});

// Static method to get products by tenant
productSchema.statics.findByTenant = function(tenantId) {
  return this.find({ tenantId, isActive: true }).sort({ name: 1 });
};

// Static method to get low stock products
productSchema.statics.findLowStock = function(tenantId) {
  return this.find({
    tenantId,
    isActive: true,
    $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
  });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'SET') {
  switch (operation) {
    case 'ADD':
      this.stockQuantity += quantity;
      break;
    case 'SUBTRACT':
      this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
      break;
    case 'SET':
    default:
      this.stockQuantity = Math.max(0, quantity);
      break;
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
