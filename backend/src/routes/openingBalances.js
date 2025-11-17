const express = require('express');
const router = express.Router();
const {
  getOpeningBalances,
  createOpeningBalance,
  postOpeningBalances
} = require('../controllers/openingBalanceController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getOpeningBalances)
  .post(authorize('OWNER', 'ACCOUNTANT'), createOpeningBalance);

router.route('/post')
  .post(authorize('OWNER'), postOpeningBalances);

module.exports = router;

