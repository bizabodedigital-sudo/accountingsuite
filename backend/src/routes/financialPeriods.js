const express = require('express');
const router = express.Router();
const {
  getFinancialPeriods,
  getFinancialPeriod,
  lockPeriod,
  unlockPeriod,
  updatePeriodSummary
} = require('../controllers/financialPeriodController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getFinancialPeriods);

router.route('/:year/:month')
  .get(getFinancialPeriod);

router.route('/:year/:month/lock')
  .post(authorize('OWNER', 'ACCOUNTANT'), lockPeriod);

router.route('/:year/:month/unlock')
  .post(authorize('OWNER'), unlockPeriod);

router.route('/:year/:month/update-summary')
  .post(updatePeriodSummary);

module.exports = router;

