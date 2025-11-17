const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const logger = require('../config/logger');
const taxService = require('../services/taxService');
const eventEmitter = require('../services/eventEmitter');

/**
 * @desc    Get all quotes
 * @route   GET /api/quotes
 * @access  Private
 */
const getQuotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId, startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(startDate && endDate && {
        issueDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    });

    const quotes = await Quote.find(query)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName')
      .populate('convertedToInvoiceId', 'number')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quote.countDocuments(query);

    res.status(200).json({
      success: true,
      data: quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting quotes'
    });
  }
};

/**
 * @desc    Get single quote
 * @route   GET /api/quotes/:id
 * @access  Private
 */
const getQuote = async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName')
      .populate('convertedToInvoiceId', 'number status');

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    logger.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting quote'
    });
  }
};

/**
 * @desc    Create quote
 * @route   POST /api/quotes
 * @access  Private
 */
const createQuote = async (req, res) => {
  try {
    const { customerId, items, expiryDate } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }
    
    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Expiry date is required'
      });
    }

    // Verify customer exists
    const customer = await Customer.findOne({
      _id: customerId,
      ...req.tenantQuery()
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Calculate tax if taxType is provided
    if (req.body.taxType) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxCalculation = taxService.calculateGCT(
        subtotal,
        req.body.taxType,
        req.body.customTaxRate
      );
      
      req.body.taxRate = taxCalculation.taxRate;
      req.body.taxAmount = taxCalculation.taxAmount;
    }

    const quoteData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const quote = await Quote.create(quoteData);

    const populatedQuote = await Quote.findById(quote._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    eventEmitter.emitEvent('quote.created', populatedQuote.toObject(), req.user.tenantId);

    res.status(201).json({
      success: true,
      data: populatedQuote
    });
  } catch (error) {
    logger.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating quote'
    });
  }
};

/**
 * @desc    Update quote
 * @route   PUT /api/quotes/:id
 * @access  Private
 */
const updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    // Don't allow updates to converted quotes
    if (quote.status === 'CONVERTED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a converted quote'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'tenantId' && key !== 'createdBy' && key !== '_id') {
        quote[key] = req.body[key];
      }
    });

    await quote.save();

    const populatedQuote = await Quote.findById(quote._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedQuote
    });
  } catch (error) {
    logger.error('Update quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating quote'
    });
  }
};

/**
 * @desc    Approve quote
 * @route   POST /api/quotes/:id/approve
 * @access  Private
 */
const approveQuote = async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    if (quote.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        error: 'Only sent quotes can be approved'
      });
    }

    quote.status = 'APPROVED';
    quote.approvedDate = new Date();
    await quote.save();

    eventEmitter.emitEvent('quote.approved', quote.toObject(), req.user.tenantId);

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    logger.error('Approve quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error approving quote'
    });
  }
};

/**
 * @desc    Convert quote to invoice
 * @route   POST /api/quotes/:id/convert
 * @access  Private
 */
const convertToInvoice = async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('customerId');

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    if (quote.status === 'CONVERTED') {
      return res.status(400).json({
        success: false,
        error: 'Quote has already been converted'
      });
    }

    // Calculate due date (30 days from today or use provided)
    const dueDate = req.body.dueDate || new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice from quote
    const invoiceData = {
      customerId: quote.customerId._id,
      items: quote.items,
      subtotal: quote.subtotal,
      taxType: quote.taxType,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      customTaxRate: quote.customTaxRate,
      total: quote.total,
      status: 'DRAFT',
      issueDate: new Date(),
      dueDate: dueDate,
      notes: `Converted from quote ${quote.number}`,
      tenantId: quote.tenantId,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Update quote
    quote.status = 'CONVERTED';
    quote.convertedToInvoiceId = invoice._id;
    await quote.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    eventEmitter.emitEvent('quote.converted', {
      quote: quote.toObject(),
      invoice: populatedInvoice.toObject()
    }, req.user.tenantId);

    res.status(201).json({
      success: true,
      message: 'Quote converted to invoice successfully',
      data: {
        quote,
        invoice: populatedInvoice
      }
    });
  } catch (error) {
    logger.error('Convert quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error converting quote'
    });
  }
};

/**
 * @desc    Delete quote
 * @route   DELETE /api/quotes/:id
 * @access  Private
 */
const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error) {
    logger.error('Delete quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting quote'
    });
  }
};

module.exports = {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  approveQuote,
  convertToInvoice,
  deleteQuote
};

