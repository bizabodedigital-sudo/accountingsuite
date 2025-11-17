const express = require('express');
const router = express.Router();
const {
  createStripeIntent,
  confirmStripePayment,
  createPayPalOrder,
  capturePayPalPayment
} = require('../controllers/paymentGatewayController');
const { protect } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Stripe routes
router.route('/stripe/create-intent')
  .post(createStripeIntent);

router.route('/stripe/confirm')
  .post(confirmStripePayment);

// PayPal routes
router.route('/paypal/create-order')
  .post(createPayPalOrder);

router.route('/paypal/capture')
  .post(capturePayPalPayment);

module.exports = router;

