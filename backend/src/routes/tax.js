const express = require('express');
const {
  calculateTax,
  calculateMultiItemTax,
  checkGCTRegistration,
  validateTRN
} = require('../controllers/taxController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Tax calculation routes
router.route('/calculate')
  .post(calculateTax);

router.route('/calculate-multi')
  .post(calculateMultiItemTax);

router.route('/check-registration')
  .post(checkGCTRegistration);

router.route('/validate-trn')
  .post(validateTRN);

module.exports = router;

