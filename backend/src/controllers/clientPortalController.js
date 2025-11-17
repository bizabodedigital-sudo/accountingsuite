const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');
const Payment = require('../models/Payment');
const logger = require('../config/logger');

/**
 * @desc    Get client invoices
 * @route   GET /api/client-portal/invoices
 * @access  Private (Client)
 */
const getClientInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      tenantId: req.user.tenantId,
      customerId: req.user.customerId
    };

    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .sort({ issueDate: -1 })
      .select('number issueDate dueDate total status items');

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    logger.error('Get client invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching invoices'
    });
  }
};

/**
 * @desc    Get client invoice by ID
 * @route   GET /api/client-portal/invoices/:id
 * @access  Private (Client)
 */
const getClientInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      customerId: req.user.customerId
    }).populate('customerId', 'name email phone address');

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
    logger.error('Get client invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching invoice'
    });
  }
};

/**
 * @desc    Get client quotes
 * @route   GET /api/client-portal/quotes
 * @access  Private (Client)
 */
const getClientQuotes = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      tenantId: req.user.tenantId,
      customerId: req.user.customerId
    };

    if (status) {
      query.status = status;
    }

    const quotes = await Quote.find(query)
      .sort({ createdAt: -1 })
      .select('number issueDate expiryDate total status items');

    res.status(200).json({
      success: true,
      data: quotes
    });
  } catch (error) {
    logger.error('Get client quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching quotes'
    });
  }
};

/**
 * @desc    Get client payments
 * @route   GET /api/client-portal/payments
 * @access  Private (Client)
 */
const getClientPayments = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      tenantId: req.user.tenantId,
      customerId: req.user.customerId
    }).select('_id number');

    const invoiceIds = invoices.map(inv => inv._id);

    const payments = await Payment.find({
      tenantId: req.user.tenantId,
      invoiceId: { $in: invoiceIds }
    })
      .populate('invoiceId', 'number issueDate')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get client payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching payments'
    });
  }
};

/**
 * @desc    Get client dashboard summary
 * @route   GET /api/client-portal/dashboard
 * @access  Private (Client)
 */
const getClientDashboard = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      tenantId: req.user.tenantId,
      customerId: req.user.customerId
    });

    const quotes = await Quote.find({
      tenantId: req.user.tenantId,
      customerId: req.user.customerId
    });

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
    const pendingInvoices = invoices.filter(inv => ['SENT', 'DRAFT'].includes(inv.status)).length;
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'SENT') return false;
      return new Date(inv.dueDate) < new Date();
    }).length;

    const totalOwed = invoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const totalPaid = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const activeQuotes = quotes.filter(q => q.status === 'APPROVED').length;

    res.status(200).json({
      success: true,
      data: {
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
          overdue: overdueInvoices
        },
        quotes: {
          total: quotes.length,
          active: activeQuotes
        },
        amounts: {
          totalOwed,
          totalPaid
        }
      }
    });
  } catch (error) {
    logger.error('Get client dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching dashboard data'
    });
  }
};

module.exports = {
  getClientInvoices,
  getClientInvoice,
  getClientQuotes,
  getClientPayments,
  getClientDashboard
};
