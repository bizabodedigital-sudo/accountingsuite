const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const AccountingEngine = require('../services/accountingEngine');
const logger = require('../config/logger');
const eventEmitter = require('../services/eventEmitter');
const WorkflowService = require('../services/workflowService');

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private
 */
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, invoiceId, paymentMethod, startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      ...(invoiceId && { invoiceId }),
      ...(paymentMethod && { paymentMethod }),
      ...(startDate && endDate && {
        paymentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    });

    const payments = await Payment.find(query)
      .populate('invoiceId', 'number total status customerId')
      .populate('createdBy', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting payments'
    });
  }
};

/**
 * @desc    Get single payment
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('invoiceId', 'number total status customerId')
      .populate('createdBy', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting payment'
    });
  }
};

/**
 * @desc    Create payment
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentDate, paymentMethod, reference, transactionId, gatewayResponse } = req.body;

    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID, amount, and payment method are required'
      });
    }

    // Get invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      ...req.tenantQuery()
    }).populate('customerId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Calculate total paid so far
    const existingPayments = await Payment.find({
      invoiceId,
      ...req.tenantQuery(),
      status: { $ne: 'CANCELLED' }
    });
    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = invoice.total - totalPaid;

    if (amount > remainingBalance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`
      });
    }

    // Check if this is a partial payment
    const isPartial = amount < remainingBalance;
    const newRemainingBalance = remainingBalance - amount;

    // Create payment
    const payment = await Payment.create({
      invoiceId,
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      reference,
      transactionId,
      gatewayResponse,
      isPartial,
      remainingBalance: newRemainingBalance,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    });

    // Update invoice status
    if (newRemainingBalance <= 0.01) {
      invoice.status = 'PAID';
      invoice.paidDate = payment.paymentDate;
    } else {
      invoice.status = 'SENT'; // Keep as SENT for partial payments
    }
    await invoice.save();

    // Create ledger entry for payment
    try {
      await AccountingEngine.createPaymentEntry({
        _id: payment._id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        invoiceNumber: invoice.number,
        reference: payment.reference,
        tenantId: payment.tenantId,
        createdBy: payment.createdBy
      });
      logger.info(`Created ledger entry for payment ${payment.paymentNumber}`);
    } catch (accountingError) {
      logger.warn(`Failed to create ledger entry for payment ${payment.paymentNumber}:`, accountingError.message);
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('invoiceId', 'number total status')
      .populate('createdBy', 'firstName lastName');

    eventEmitter.emitEvent('payment.created', populatedPayment.toObject(), req.user.tenantId);

    // Execute workflows for payment received
    try {
      await WorkflowService.executeWorkflows('PAYMENT_RECEIVED', {
        documentType: 'PAYMENT',
        documentId: payment._id,
        payment: populatedPayment.toObject(),
        invoice: invoice.toObject(),
        amount: payment.amount,
        customerId: invoice.customerId
      }, req.user.tenantId);
    } catch (workflowError) {
      logger.warn('Workflow execution error:', workflowError);
    }

    // Also check if invoice is now fully paid
    if (invoice.status === 'PAID') {
      try {
        await WorkflowService.executeWorkflows('INVOICE_PAID', {
          documentType: 'INVOICE',
          documentId: invoice._id,
          invoice: invoice.toObject(),
          status: 'PAID',
          amount: invoice.total,
          customerId: invoice.customerId
        }, req.user.tenantId);
      } catch (workflowError) {
        logger.warn('Workflow execution error:', workflowError);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedPayment
    });
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating payment'
    });
  }
};

/**
 * @desc    Refund payment
 * @route   POST /api/payments/:id/refund
 * @access  Private (OWNER, ACCOUNTANT)
 */
const refundPayment = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const payment = await Payment.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('invoiceId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (!payment.canRefund()) {
      return res.status(400).json({
        success: false,
        error: 'Payment cannot be refunded'
      });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > (payment.amount - payment.refundedAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount exceeds available amount'
      });
    }

    payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();

    if (payment.refundedAmount >= payment.amount) {
      payment.status = 'REFUNDED';
    }

    await payment.save();

    // Update invoice status if fully refunded
    if (payment.refundedAmount >= payment.amount) {
      const invoice = payment.invoiceId;
      invoice.status = 'SENT';
      invoice.paidDate = null;
      await invoice.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error refunding payment'
    });
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  refundPayment
};

