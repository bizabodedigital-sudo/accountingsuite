const express = require('express');
const {
  generateProfitLoss,
  generateIncomeByCustomer,
  generateExpensesByCategory
} = require('../controllers/reportController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Report routes
router.get('/profit-loss', generateProfitLoss);
router.get('/income-by-customer', generateIncomeByCustomer);
router.get('/expenses-by-category', generateExpensesByCategory);

module.exports = router;

