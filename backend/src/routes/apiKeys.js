const express = require('express');
const router = express.Router();
const {
  getApiKeys,
  getApiKey,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey
} = require('../controllers/apiKeyController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication and tenant filtering
router.use(protect);
router.use(tenantFilter());

// API key routes
router.route('/')
  .get(getApiKeys)
  .post(authorize('OWNER', 'ACCOUNTANT'), createApiKey);

router.route('/:id')
  .get(getApiKey)
  .put(authorize('OWNER', 'ACCOUNTANT'), updateApiKey)
  .delete(authorize('OWNER', 'ACCOUNTANT'), deleteApiKey);

router.route('/:id/revoke')
  .post(authorize('OWNER', 'ACCOUNTANT'), revokeApiKey);

module.exports = router;





