const express = require('express');
const router = express.Router();
const {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  regenerateSecret
} = require('../controllers/webhookController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication and tenant filtering
router.use(protect);
router.use(tenantFilter());

// Webhook routes
router.route('/')
  .get(getWebhooks)
  .post(authorize('OWNER', 'ACCOUNTANT'), createWebhook);

router.route('/:id')
  .get(getWebhook)
  .put(authorize('OWNER', 'ACCOUNTANT'), updateWebhook)
  .delete(authorize('OWNER', 'ACCOUNTANT'), deleteWebhook);

router.route('/:id/test')
  .post(authorize('OWNER', 'ACCOUNTANT'), testWebhook);

router.route('/:id/deliveries')
  .get(getWebhookDeliveries);

router.route('/:id/regenerate-secret')
  .post(authorize('OWNER', 'ACCOUNTANT'), regenerateSecret);

module.exports = router;


