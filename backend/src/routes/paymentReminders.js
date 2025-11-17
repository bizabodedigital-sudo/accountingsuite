const express = require('express');
const router = express.Router();
const {
  sendReminder,
  sendOverdueReminders,
  autoSendReminders
} = require('../controllers/paymentReminderController');
const { protect } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/:invoiceId')
  .post(sendReminder);

router.route('/overdue')
  .post(sendOverdueReminders);

router.route('/auto')
  .post(autoSendReminders);

module.exports = router;

