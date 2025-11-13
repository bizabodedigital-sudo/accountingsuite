const express = require('express');
const {
  getSettings,
  getAllSettings,
  updateTenantSettings,
  updateProfileSettings,
  updatePreferences,
  updateCompanyDetails,
  updateTaxSettings,
  updatePaymentSettings,
  updateLocalizationSettings,
  updateProductSettings,
  updateTaskSettings,
  updateExpenseSettings,
  updateWorkflowSettings,
  updateNumberingSettings,
  updateEmailSettings,
  updateClientPortalSettings,
  updateAdvancedSettings
} = require('../controllers/settingsController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Settings routes
router.get('/', getSettings);
router.get('/all', getAllSettings);
router.put('/tenant', updateTenantSettings);
router.put('/profile', updateProfileSettings);
router.put('/preferences', updatePreferences);
router.put('/company-details', updateCompanyDetails);
router.put('/tax', updateTaxSettings);
router.put('/payments', updatePaymentSettings);
router.put('/localization', updateLocalizationSettings);
router.put('/products', updateProductSettings);
router.put('/tasks', updateTaskSettings);
router.put('/expenses', updateExpenseSettings);
router.put('/workflows', updateWorkflowSettings);
router.put('/numbering', updateNumberingSettings);
router.put('/email', updateEmailSettings);
router.put('/client-portal', updateClientPortalSettings);
router.put('/advanced', updateAdvancedSettings);

module.exports = router;

