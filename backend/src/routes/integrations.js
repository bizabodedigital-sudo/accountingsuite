const express = require('express');
const router = express.Router();
const {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
} = require('../controllers/integrationController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication and tenant filtering
router.use(protect);
router.use(tenantFilter());

// Integration routes
router.route('/')
  .get(getIntegrations)
  .post(authorize('OWNER', 'ACCOUNTANT'), createIntegration);

router.route('/:id')
  .get(getIntegration)
  .put(authorize('OWNER', 'ACCOUNTANT'), updateIntegration)
  .delete(authorize('OWNER', 'ACCOUNTANT'), deleteIntegration);

router.route('/:id/test')
  .post(authorize('OWNER', 'ACCOUNTANT'), testIntegration);

module.exports = router;






