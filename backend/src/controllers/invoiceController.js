const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');
const pdfService = require('../services/pdfService');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
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

    const invoices = await Invoice.find(query)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting invoices'
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting invoice'
    });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    // Validate required fields
    const { customerId, items, dueDate } = req.body;
    
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
    
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Due date is required'
      });
    }
    
    // Validate due date is not in the past (allow same day)
    const dueDateObj = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    dueDateObj.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (dueDateObj < today) {
      return res.status(400).json({
        success: false,
        error: 'Due date cannot be in the past'
      });
    }
    
    // Validate items
    for (const item of items) {
      if (!item.description || !item.description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Item description is required'
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Item quantity must be greater than 0'
        });
      }
      if (item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'Item unit price cannot be negative'
        });
      }
    }

    // Verify customer exists and belongs to tenant
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

    const invoiceData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Populate the created invoice
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    logger.error('Create invoice error:', error);
    console.error('Full error details:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error creating invoice'
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating invoice'
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting invoice'
    });
  }
};

// @desc    Send invoice
// @route   POST /api/invoices/:id/send
// @access  Private
const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      { status: 'SENT' },
      { new: true }
    )
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // TODO: Re-enable email sending when services are ready
    logger.info(`Invoice ${invoice.number} status updated to SENT`);

    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice sent successfully'
    });
  } catch (error) {
    logger.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error sending invoice'
    });
  }
};

// @desc    Void invoice
// @route   POST /api/invoices/:id/void
// @access  Private
const voidInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      { status: 'CANCELLED' },
      { new: true }
    )
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice voided successfully'
    });
  } catch (error) {
    logger.error('Void invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error voiding invoice'
    });
  }
};

// @desc    Download invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Get tenant information
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // For now, return a simple HTML response that can be printed as PDF
    // This avoids puppeteer issues in Docker containers
    const html = generateSimpleInvoiceHTML(invoice, invoice.customerId, tenant);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.number || invoice._id}.html"`);
    res.send(html);
  } catch (error) {
    logger.error('Download invoice PDF error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating PDF'
    });
  }
};

// Simple HTML generator for invoices (can be printed as PDF)
const generateSimpleInvoiceHTML = (invoice, customer, tenant) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: tenant.currency || 'JMD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-JM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.number || 'Draft'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company { font-size: 24px; font-weight: bold; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { margin: 0; font-size: 28px; }
        .invoice-number { color: #666; font-size: 18px; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
        .bill-to h3 { margin-bottom: 10px; }
        .meta { font-size: 14px; }
        .meta-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .totals { float: right; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .total-row.final { font-weight: bold; font-size: 18px; background-color: #f5f5f5; padding: 10px; }
        .notes { margin-top: 30px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">${tenant.name}</div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <div class="invoice-number">#${invoice.number || 'Draft'}</div>
        </div>
      </div>

      <div class="details">
        <div class="bill-to">
          <h3>Bill To:</h3>
          <div>${customer.name}</div>
          <div>${customer.email}</div>
          ${customer.phone ? `<div>${customer.phone}</div>` : ''}
          ${customer.address ? `<div>${customer.address}</div>` : ''}
        </div>
        <div class="meta">
          <div class="meta-item">
            <span>Invoice Date:</span>
            <span>${formatDate(invoice.issueDate)}</span>
          </div>
          <div class="meta-item">
            <span>Due Date:</span>
            <span>${formatDate(invoice.dueDate)}</span>
          </div>
          ${invoice.poNumber ? `
            <div class="meta-item">
              <span>PO Number:</span>
              <span>${invoice.poNumber}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.unitPrice)}</td>
              <td class="text-right">${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Tax (${invoice.taxRate}%):</span>
          <span>${formatCurrency(invoice.taxAmount)}</span>
        </div>
        <div class="total-row final">
          <span>Total:</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes">
          <h3>Notes:</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <script>
        // Auto-print when page loads
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  voidInvoice,
  downloadInvoicePDF
};







