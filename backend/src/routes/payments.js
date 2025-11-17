const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPayment,
  createPayment,
  refundPayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .get(getPayment);

router.route('/:id/refund')
  .post(authorize('OWNER', 'ACCOUNTANT'), refundPayment);

module.exports = router;

