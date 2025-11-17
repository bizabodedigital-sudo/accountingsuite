const logger = require('../config/logger');

/**
 * Payment Gateway Service
 * Handles integration with payment gateways (Stripe, PayPal, etc.)
 */
class PaymentGatewayService {
  /**
   * Process Stripe payment
   */
  static async processStripePayment({
    amount,
    currency,
    invoiceId,
    invoiceNumber,
    customerEmail,
    customerName,
    description,
    metadata = {}
  }) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: description || `Invoice ${invoiceNumber}`,
        metadata: {
          invoiceId: invoiceId.toString(),
          invoiceNumber,
          ...metadata
        },
        receipt_email: customerEmail
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        gateway: 'STRIPE',
        data: paymentIntent
      };
    } catch (error) {
      logger.error('Stripe payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'STRIPE'
      };
    }
  }

  /**
   * Confirm Stripe payment
   */
  static async confirmStripePayment(paymentIntentId) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        transactionId: paymentIntent.id,
        gateway: 'STRIPE',
        data: paymentIntent
      };
    } catch (error) {
      logger.error('Stripe confirmation error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'STRIPE'
      };
    }
  }

  /**
   * Process PayPal payment
   */
  static async processPayPalPayment({
    amount,
    currency,
    invoiceId,
    invoiceNumber,
    returnUrl,
    cancelUrl,
    description
  }) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = process.env.PAYPAL_ENVIRONMENT === 'production'
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

      const client = new paypal.core.PayPalHttpClient(environment);

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: invoiceId.toString(),
          description: description || `Invoice ${invoiceNumber}`,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl
        }
      });

      const order = await client.execute(request);

      return {
        success: true,
        orderId: order.result.id,
        approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href,
        status: order.result.status,
        gateway: 'PAYPAL',
        data: order.result
      };
    } catch (error) {
      logger.error('PayPal payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'PAYPAL'
      };
    }
  }

  /**
   * Capture PayPal payment
   */
  static async capturePayPalPayment(orderId) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = process.env.PAYPAL_ENVIRONMENT === 'production'
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

      const client = new paypal.core.PayPalHttpClient(environment);

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const capture = await client.execute(request);

      return {
        success: capture.result.status === 'COMPLETED',
        status: capture.result.status,
        amount: parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value),
        currency: capture.result.purchase_units[0].payments.captures[0].amount.currency_code,
        transactionId: capture.result.purchase_units[0].payments.captures[0].id,
        gateway: 'PAYPAL',
        data: capture.result
      };
    } catch (error) {
      logger.error('PayPal capture error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'PAYPAL'
      };
    }
  }

  /**
   * Process WiPay payment (Jamaican gateway)
   */
  static async processWiPayPayment({
    amount,
    currency,
    invoiceId,
    invoiceNumber,
    customerEmail,
    returnUrl
  }) {
    try {
      // WiPay API integration
      // This is a placeholder - actual implementation would use WiPay SDK
      const wipay = require('wipay-sdk'); // Placeholder
      
      const payment = await wipay.createPayment({
        amount,
        currency,
        reference: invoiceNumber,
        email: customerEmail,
        return_url: returnUrl
      });

      return {
        success: true,
        paymentId: payment.id,
        paymentUrl: payment.payment_url,
        status: payment.status,
        gateway: 'WIPAY',
        data: payment
      };
    } catch (error) {
      logger.error('WiPay payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'WIPAY'
      };
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(gateway, transactionId, amount, reason) {
    try {
      switch (gateway) {
        case 'STRIPE':
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          const refund = await stripe.refunds.create({
            payment_intent: transactionId,
            amount: amount ? Math.round(amount * 100) : undefined,
            reason: reason || 'requested_by_customer'
          });
          return {
            success: true,
            refundId: refund.id,
            status: refund.status,
            amount: refund.amount / 100,
            gateway: 'STRIPE'
          };

        case 'PAYPAL':
          // PayPal refund implementation
          return {
            success: false,
            error: 'PayPal refund not yet implemented',
            gateway: 'PAYPAL'
          };

        default:
          return {
            success: false,
            error: `Refund not supported for gateway: ${gateway}`,
            gateway
          };
      }
    } catch (error) {
      logger.error('Refund payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway
      };
    }
  }
}

module.exports = PaymentGatewayService;

