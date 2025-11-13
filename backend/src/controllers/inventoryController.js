const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const logger = require('../config/logger');

// @desc    Get inventory movements
// @route   GET /api/inventory/movements
// @access  Private
const getMovements = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { productId, movementType, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { tenantId };

    if (productId) {
      query.productId = productId;
    }

    if (movementType) {
      query.movementType = movementType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const movements = await InventoryMovement.find(query)
      .populate('productId', 'name sku')
      .populate('performedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await InventoryMovement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get movements error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get movements'
    });
  }
};

// @desc    Adjust inventory
// @route   POST /api/inventory/adjust
// @access  Private
const adjustInventory = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { productId, quantity, movementType, unitCost, reason, notes, reference } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }

    // Get product
    const product = await Product.findOne({
      _id: productId,
      tenantId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const previousQuantity = product.stockQuantity;
    const adjustmentQuantity = parseFloat(quantity);

    // Create movement record
    const movement = await InventoryMovement.create({
      tenantId,
      productId,
      movementType: movementType || 'ADJUSTMENT',
      quantity: adjustmentQuantity,
      previousQuantity,
      newQuantity: previousQuantity + adjustmentQuantity,
      unitCost: unitCost || product.cost || 0,
      totalCost: Math.abs(adjustmentQuantity) * (unitCost || product.cost || 0),
      reason,
      notes,
      reference: reference ? {
        type: reference.type,
        id: reference.id,
        number: reference.number
      } : undefined,
      performedBy: req.user._id,
      status: 'COMPLETED'
    });

    // Update product stock
    if (adjustmentQuantity > 0) {
      await product.updateStock(previousQuantity + adjustmentQuantity, 'SET');
    } else {
      await product.updateStock(Math.max(0, previousQuantity + adjustmentQuantity), 'SET');
    }

    // Get updated product
    const updatedProduct = await Product.findById(productId);

    res.status(201).json({
      success: true,
      data: {
        movement,
        product: updatedProduct
      }
    });
  } catch (error) {
    logger.error('Adjust inventory error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to adjust inventory'
    });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStock = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const products = await Product.find({
      tenantId,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    }).sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    logger.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get low stock alerts'
    });
  }
};

// @desc    Get inventory summary
// @route   GET /api/inventory/summary
// @access  Private
const getInventorySummary = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const products = await Product.find({ tenantId, isActive: true });
    
    const summary = {
      totalProducts: products.length,
      totalValue: 0,
      totalQuantity: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      byCategory: {},
      byStatus: {
        IN_STOCK: 0,
        LOW_STOCK: 0,
        OUT_OF_STOCK: 0,
        OVERSTOCK: 0
      }
    };

    products.forEach(product => {
      summary.totalValue += product.stockQuantity * product.unitPrice;
      summary.totalQuantity += product.stockQuantity;

      if (product.stockQuantity <= 0) {
        summary.outOfStockCount++;
      } else if (product.stockQuantity <= product.minStockLevel) {
        summary.lowStockCount++;
      }

      const status = product.stockStatus;
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      const category = product.category;
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      summary.byCategory[category].count++;
      summary.byCategory[category].quantity += product.stockQuantity;
      summary.byCategory[category].value += product.stockQuantity * product.unitPrice;
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get inventory summary'
    });
  }
};

// @desc    Get product stock history
// @route   GET /api/inventory/history/:productId
// @access  Private
const getStockHistory = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const history = await InventoryMovement.getStockHistory(
      tenantId,
      productId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stock history'
    });
  }
};

module.exports = {
  getMovements,
  adjustInventory,
  getLowStock,
  getInventorySummary,
  getStockHistory
};

