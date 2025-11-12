const Product = require('../models/Product');
const logger = require('../config/logger');

// Get all products for a tenant
const getProducts = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    logger.info(`🔍 Getting products for tenant: ${tenantId}, limit: ${limit}, isActive: ${isActive}`);

    // Build query
    const query = { tenantId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    logger.info(`🔍 Query built:`, JSON.stringify(query, null, 2));

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    const total = await Product.countDocuments(query);
    
    logger.info(`✅ Found ${products.length} products (total: ${total}) for tenant ${tenantId}`);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get a single product
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const product = await Product.findOne({ _id: id, tenantId })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    
    // Extract and validate required fields
    const { name, description, sku, unitPrice, unit, taxRate, category, isActive, stockQuantity, minStockLevel, maxStockLevel, isService } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }
    
    if (!unitPrice || unitPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price is required and must be greater than 0'
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Product category is required'
      });
    }
    
    if (!unit) {
      return res.status(400).json({
        success: false,
        message: 'Unit is required'
      });
    }

    // Prepare product data
    const productData = {
      name: name.trim(),
      description: description?.trim() || '',
      sku: sku && sku.trim() !== '' ? sku.trim().toUpperCase() : undefined, // Let Mongoose handle auto-generation
      unitPrice: parseFloat(unitPrice),
      unit: unit,
      taxRate: parseFloat(taxRate || 0),
      category: category,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      stockQuantity: parseInt(stockQuantity || 0),
      minStockLevel: parseInt(minStockLevel || 0),
      maxStockLevel: parseInt(maxStockLevel || 1000),
      isService: Boolean(isService),
      tenantId,
      createdBy: userId
    };

    const product = new Product(productData);
    await product.save();

    await product.populate('createdBy', 'firstName lastName email');

    logger.info(`Product created: ${product.name} (${product.sku}) by user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists',
        field: 'sku'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, id: userId } = req.user;

    const product = await Product.findOne({ _id: id, tenantId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    product.lastModifiedBy = userId;
    await product.save();

    await product.populate('createdBy', 'firstName lastName email');
    await product.populate('lastModifiedBy', 'firstName lastName email');

    logger.info(`Product updated: ${product.name} (${product.sku}) by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists',
        field: 'sku'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// Delete a product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, id: userId } = req.user;

    const product = await Product.findOne({ _id: id, tenantId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    product.lastModifiedBy = userId;
    await product.save();

    logger.info(`Product deleted: ${product.name} (${product.sku}) by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Update product stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'SET' } = req.body;
    const { tenantId, id: userId } = req.user;

    const product = await Product.findOne({ _id: id, tenantId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.updateStock(quantity, operation);
    product.lastModifiedBy = userId;
    await product.save();

    logger.info(`Stock updated for product ${product.name} (${product.sku}): ${operation} ${quantity} by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId: product._id,
        newStock: product.stockQuantity,
        operation,
        quantity
      }
    });
  } catch (error) {
    logger.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const lowStockProducts = await Product.findLowStock(tenantId)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: lowStockProducts,
      count: lowStockProducts.length
    });
  } catch (error) {
    logger.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
};

// Get product categories
const getCategories = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const categories = await Product.distinct('category', { tenantId, isActive: true });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories
};





