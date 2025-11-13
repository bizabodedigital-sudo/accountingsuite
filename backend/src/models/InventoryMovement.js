const mongoose = require('mongoose');

/**
 * Inventory Movement Schema
 * Tracks all inventory movements (stock adjustments, sales, purchases, etc.)
 */
const inventoryMovementSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  movementType: {
    type: String,
    required: true,
    enum: [
      'PURCHASE',      // Stock purchased/received
      'SALE',          // Stock sold
      'ADJUSTMENT',    // Manual adjustment
      'RETURN',        // Stock returned
      'DAMAGED',       // Stock damaged/lost
      'TRANSFER',      // Stock transferred
      'CORRECTION'     // Error correction
    ]
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  unitCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  reference: {
    type: {
      type: String,
      enum: ['INVOICE', 'EXPENSE', 'PURCHASE_ORDER', 'ADJUSTMENT', 'OTHER']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    },
    number: String
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
    default: 'COMPLETED'
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

// Indexes
inventoryMovementSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });
inventoryMovementSchema.index({ tenantId: 1, movementType: 1 });
inventoryMovementSchema.index({ tenantId: 1, 'reference.type': 1, 'reference.id': 1 });
inventoryMovementSchema.index({ status: 1 });

// Virtual for movement direction
inventoryMovementSchema.virtual('isIncrease').get(function() {
  return this.quantity > 0;
});

// Virtual for movement description
inventoryMovementSchema.virtual('description').get(function() {
  const direction = this.quantity > 0 ? 'Increased' : 'Decreased';
  return `${direction} by ${Math.abs(this.quantity)} units`;
});

// Pre-save middleware to calculate new quantity
inventoryMovementSchema.pre('save', function(next) {
  this.newQuantity = this.previousQuantity + this.quantity;
  
  if (this.unitCost && this.quantity) {
    this.totalCost = Math.abs(this.quantity) * this.unitCost;
  }
  
  next();
});

// Static method to get movements for a product
inventoryMovementSchema.statics.getProductMovements = function(tenantId, productId, filters = {}) {
  return this.find({ tenantId, productId, ...filters })
    .populate('performedBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to get stock history
inventoryMovementSchema.statics.getStockHistory = function(tenantId, productId, startDate, endDate) {
  const query = { tenantId, productId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('performedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to get low stock alerts
inventoryMovementSchema.statics.getLowStockProducts = async function(tenantId) {
  const Product = mongoose.model('Product');
  const products = await Product.find({ tenantId, isActive: true });
  
  const lowStockProducts = [];
  
  for (const product of products) {
    if (product.stockQuantity <= product.minStockLevel) {
      // Get recent movements
      const recentMovements = await this.find({
        tenantId,
        productId: product._id
      })
      .sort({ createdAt: -1 })
      .limit(5);
      
      lowStockProducts.push({
        product,
        recentMovements
      });
    }
  }
  
  return lowStockProducts;
};

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);

