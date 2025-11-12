const express = require('express');
const {
  getSettings,
  updateTenantSettings,
  updateProfileSettings,
  updatePreferences
} = require('../controllers/settingsController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Settings routes
router.get('/', getSettings);
router.put('/tenant', updateTenantSettings);
router.put('/profile', updateProfileSettings);
router.put('/preferences', updatePreferences);

module.exports = router;

