const RecurringInvoice = require('../models/RecurringInvoice');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');

// @desc    Get all recurring invoices
// @route   GET /api/recurring-invoices
// @access  Private
const getRecurringInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId, frequency } = req.query;
    
    const query = req.tenantQuery({
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(frequency && { frequency }),
      isActive: true
    });

    const recurringInvoices = await RecurringInvoice.find(query)
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RecurringInvoice.countDocuments(query);

    res.status(200).json({
      success: true,
      data: recurringInvoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get recurring invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting recurring invoices'
    });
  }
};

// @desc    Get single recurring invoice
// @route   GET /api/recurring-invoices/:id
// @access  Private
const getRecurringInvoice = async (req, res) => {
  try {
    const recurringInvoice = await RecurringInvoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName')
      .populate('lastGeneratedInvoiceId', 'number status total');

    if (!recurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: recurringInvoice
    });
  } catch (error) {
    logger.error('Get recurring invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting recurring invoice'
    });
  }
};

// @desc    Create recurring invoice
// @route   POST /api/recurring-invoices
// @access  Private
const createRecurringInvoice = async (req, res) => {
  try {
    // Validate required fields
    const { 
      name, 
      customerId, 
      items, 
      frequency, 
      startDate, 
      dueDate 
    } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Recurring invoice name is required'
      });
    }
    
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
    
    if (!frequency) {
      return res.status(400).json({
        success: false,
        error: 'Frequency is required'
      });
    }
    
    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date is required'
      });
    }
    
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Due date is required'
      });
    }
    
    // Validate start date is not in the past
    const startDateObj = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDateObj.setHours(0, 0, 0, 0);
    
    if (startDateObj < today) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be in the past'
      });
    }
    
    // Validate due date is not in the past
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    
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

    // Calculate next run date
    const nextRunDate = new Date(startDate);
    
    // Create recurring invoice
    const recurringInvoiceData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
      nextRunDate: nextRunDate
    };

    const recurringInvoice = new RecurringInvoice(recurringInvoiceData);
    await recurringInvoice.save();

    // Populate the response
    await recurringInvoice.populate([
      { path: 'customerId', select: 'name email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: recurringInvoice,
      message: 'Recurring invoice created successfully'
    });
  } catch (error) {
    logger.error('Create recurring invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating recurring invoice'
    });
  }
};

// @desc    Update recurring invoice
// @route   PUT /api/recurring-invoices/:id
// @access  Private
const updateRecurringInvoice = async (req, res) => {
  try {
    const recurringInvoice = await RecurringInvoice.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      { 
        ...req.body,
        lastModifiedBy: req.user.id
      },
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name email')
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!recurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: recurringInvoice,
      message: 'Recurring invoice updated successfully'
    });
  } catch (error) {
    logger.error('Update recurring invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating recurring invoice'
    });
  }
};

// @desc    Delete recurring invoice
// @route   DELETE /api/recurring-invoices/:id
// @access  Private
const deleteRecurringInvoice = async (req, res) => {
  try {
    const recurringInvoice = await RecurringInvoice.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      { isActive: false },
      { new: true }
    );

    if (!recurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring invoice deleted successfully'
    });
  } catch (error) {
    logger.error('Delete recurring invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting recurring invoice'
    });
  }
};

// @desc    Toggle recurring invoice status
// @route   POST /api/recurring-invoices/:id/toggle-status
// @access  Private
const toggleRecurringInvoiceStatus = async (req, res) => {
  try {
    const recurringInvoice = await RecurringInvoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!recurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
      });
    }

    const newStatus = recurringInvoice.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    recurringInvoice.status = newStatus;
    recurringInvoice.lastModifiedBy = req.user.id;
    
    await recurringInvoice.save();

    await recurringInvoice.populate([
      { path: 'customerId', select: 'name email' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'lastModifiedBy', select: 'firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      data: recurringInvoice,
      message: `Recurring invoice ${newStatus.toLowerCase()} successfully`
    });
  } catch (error) {
    logger.error('Toggle recurring invoice status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error toggling recurring invoice status'
    });
  }
};

// @desc    Generate invoice from recurring template
// @route   POST /api/recurring-invoices/:id/generate
// @access  Private
const generateInvoiceFromRecurring = async (req, res) => {
  try {
    const recurringInvoice = await RecurringInvoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!recurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
      });
    }

    if (recurringInvoice.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate invoice from inactive recurring invoice'
      });
    }

    // Generate the invoice
    const invoice = await recurringInvoice.generateInvoice();

    // Populate the invoice
    await invoice.populate([
      { path: 'customerId', select: 'name email phone address' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice generated successfully from recurring template'
    });
  } catch (error) {
    logger.error('Generate invoice from recurring error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating invoice from recurring template'
    });
  }
};

// @desc    Duplicate recurring invoice
// @route   POST /api/recurring-invoices/:id/duplicate
// @access  Private
const duplicateRecurringInvoice = async (req, res) => {
  try {
    const originalRecurringInvoice = await RecurringInvoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!originalRecurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
      });
    }

    // Create duplicate with modified data
    const duplicateData = {
      ...originalRecurringInvoice.toObject(),
      _id: undefined,
      name: `${originalRecurringInvoice.name} (Copy)`,
      status: 'PAUSED',
      nextRunDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      totalGenerated: 0,
      lastGeneratedInvoiceId: null,
      lastRunDate: null,
      createdAt: undefined,
      updatedAt: undefined,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    };

    const duplicateRecurringInvoice = new RecurringInvoice(duplicateData);
    await duplicateRecurringInvoice.save();

    // Populate the response
    await duplicateRecurringInvoice.populate([
      { path: 'customerId', select: 'name email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: duplicateRecurringInvoice,
      message: 'Recurring invoice duplicated successfully'
    });
  } catch (error) {
    logger.error('Duplicate recurring invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error duplicating recurring invoice'
    });
  }
};

// @desc    Download recurring invoice PDF (preview)
// @route   GET /api/recurring-invoices/:id/pdf
// @access  Private
const downloadRecurringInvoicePDF = async (req, res) => {
  try {
    const recurringInvoice = await RecurringInvoice.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName');

    if (!recurringInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Recurring invoice not found'
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

    // Generate HTML for preview (similar to regular invoice)
    const html = generateSimpleRecurringInvoiceHTML(recurringInvoice, recurringInvoice.customerId, tenant);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="recurring-invoice-${recurringInvoice.name}.html"`);
    res.send(html);
  } catch (error) {
    logger.error('Download recurring invoice PDF error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating PDF'
    });
  }
};

// Helper function to generate simple HTML for recurring invoice preview
const generateSimpleRecurringInvoiceHTML = (recurringInvoice, customer, tenant) => {
  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-JM', { style: 'currency', currency: 'JMD' }).format(amount);
  
  const formatDate = (date) => 
    new Date(date).toLocaleDateString('en-JM');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recurring Invoice ${recurringInvoice.name}</title>
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
        .recurring-info { background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">${tenant.name}</div>
        <div class="invoice-title">
          <h1>RECURRING INVOICE</h1>
          <div class="invoice-number">${recurringInvoice.name}</div>
        </div>
      </div>

      <div class="recurring-info">
        <h3>Recurring Schedule</h3>
        <div class="meta-item">
          <span>Frequency:</span>
          <span>${recurringInvoice.frequency}</span>
        </div>
        <div class="meta-item">
          <span>Next Run:</span>
          <span>${formatDate(recurringInvoice.nextRunDate)}</span>
        </div>
        <div class="meta-item">
          <span>Status:</span>
          <span>${recurringInvoice.status}</span>
        </div>
        <div class="meta-item">
          <span>Total Generated:</span>
          <span>${recurringInvoice.totalGenerated} invoices</span>
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
            <span>Start Date:</span>
            <span>${formatDate(recurringInvoice.startDate)}</span>
          </div>
          <div class="meta-item">
            <span>End Date:</span>
            <span>${recurringInvoice.endDate ? formatDate(recurringInvoice.endDate) : 'No end date'}</span>
          </div>
          ${recurringInvoice.poNumber ? `
            <div class="meta-item">
              <span>PO Number:</span>
              <span>${recurringInvoice.poNumber}</span>
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
          ${recurringInvoice.items.map(item => `
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
          <span>${formatCurrency(recurringInvoice.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Tax (${recurringInvoice.taxRate}%):</span>
          <span>${formatCurrency(recurringInvoice.taxAmount)}</span>
        </div>
        <div class="total-row final">
          <span>Total:</span>
          <span>${formatCurrency(recurringInvoice.total)}</span>
        </div>
      </div>

      ${recurringInvoice.notes ? `
        <div class="notes">
          <h3>Notes:</h3>
          <p>${recurringInvoice.notes}</p>
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
  getRecurringInvoices,
  getRecurringInvoice,
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  toggleRecurringInvoiceStatus,
  generateInvoiceFromRecurring,
  duplicateRecurringInvoice,
  downloadRecurringInvoicePDF
};


