const PaymentGatewayService = require('../services/paymentGatewayService');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const AccountingEngine = require('../services/accountingEngine');
const logger = require('../config/logger');

/**
 * @desc    Create payment intent (Stripe)
 * @route   POST /api/payment-gateways/stripe/create-intent
 * @access  Private
 */
const createStripeIntent = async (req, res) => {
  try {
    const { invoiceId } = req.body;

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

    const result = await PaymentGatewayService.processStripePayment({
      amount: invoice.total,
      currency: 'JMD', // or invoice.currency
      invoiceId: invoice._id,
      invoiceNumber: invoice.number,
      customerEmail: invoice.customerId?.email,
      customerName: invoice.customerId?.name,
      description: `Invoice ${invoice.number}`,
      metadata: {
        tenantId: invoice.tenantId.toString()
      }
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Create Stripe intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating payment intent'
    });
  }
};

/**
 * @desc    Confirm Stripe payment
 * @route   POST /api/payment-gateways/stripe/confirm
 * @access  Private
 */
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, invoiceId } = req.body;

    const result = await PaymentGatewayService.confirmStripePayment(paymentIntentId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Payment confirmation failed'
      });
    }

    // Create payment record
    const invoice = await Invoice.findById(invoiceId);
    if (invoice) {
      const payment = await Payment.create({
        invoiceId: invoice._id,
        amount: result.amount,
        paymentDate: new Date(),
        paymentMethod: 'STRIPE',
        reference: paymentIntentId,
        transactionId: paymentIntentId,
        gatewayResponse: result.data,
        status: 'COMPLETED',
        tenantId: invoice.tenantId,
        createdBy: req.user._id
      });

      // Update invoice status
      invoice.status = 'PAID';
      invoice.paidDate = new Date();
      await invoice.save();

      // Create ledger entry
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
      } catch (accountingError) {
        logger.warn('Failed to create ledger entry for payment:', accountingError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Confirm Stripe payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error confirming payment'
    });
  }
};

/**
 * @desc    Create PayPal order
 * @route   POST /api/payment-gateways/paypal/create-order
 * @access  Private
 */
const createPayPalOrder = async (req, res) => {
  try {
    const { invoiceId, returnUrl, cancelUrl } = req.body;

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

    const result = await PaymentGatewayService.processPayPalPayment({
      amount: invoice.total,
      currency: 'JMD',
      invoiceId: invoice._id,
      invoiceNumber: invoice.number,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL}/invoices/${invoiceId}/payment-success`,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/invoices/${invoiceId}`,
      description: `Invoice ${invoice.number}`
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Create PayPal order error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating PayPal order'
    });
  }
};

/**
 * @desc    Capture PayPal payment
 * @route   POST /api/payment-gateways/paypal/capture
 * @access  Private
 */
const capturePayPalPayment = async (req, res) => {
  try {
    const { orderId, invoiceId } = req.body;

    const result = await PaymentGatewayService.capturePayPalPayment(orderId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Payment capture failed'
      });
    }

    // Create payment record
    const invoice = await Invoice.findById(invoiceId);
    if (invoice) {
      const payment = await Payment.create({
        invoiceId: invoice._id,
        amount: result.amount,
        paymentDate: new Date(),
        paymentMethod: 'PAYPAL',
        reference: orderId,
        transactionId: result.transactionId,
        gatewayResponse: result.data,
        status: 'COMPLETED',
        tenantId: invoice.tenantId,
        createdBy: req.user._id
      });

      // Update invoice
      invoice.status = 'PAID';
      invoice.paidDate = new Date();
      await invoice.save();

      // Create ledger entry
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
      } catch (accountingError) {
        logger.warn('Failed to create ledger entry for payment:', accountingError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment captured successfully',
      data: result
    });
  } catch (error) {
    logger.error('Capture PayPal payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error capturing payment'
    });
  }
};

module.exports = {
  createStripeIntent,
  confirmStripePayment,
  createPayPalOrder,
  capturePayPalPayment
};

