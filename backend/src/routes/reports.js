const express = require('express');
const {
  generateProfitLoss,
  generateBalanceSheet,
  generateCashFlow,
  generateAccountsReceivableAging,
  generateAccountsPayableAging,
  generateSalesByCustomer,
  generateSalesByProduct,
  generateExpensesByVendor,
  generateIncomeByCustomer,
  generateExpensesByCategory,
  generateTaxSummary,
  generateTrialBalance,
  generateCustomerProfitability
} = require('../controllers/reportController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Business Overview Reports
router.get('/profit-loss', generateProfitLoss);
router.get('/balance-sheet', generateBalanceSheet);
router.get('/cash-flow', generateCashFlow);
router.get('/trial-balance', generateTrialBalance);

// Accounts Receivable Reports
router.get('/accounts-receivable-aging', generateAccountsReceivableAging);
router.get('/sales-by-customer', generateSalesByCustomer);
router.get('/income-by-customer', generateIncomeByCustomer);
router.get('/customer-profitability', generateCustomerProfitability);

// Accounts Payable Reports
router.get('/accounts-payable-aging', generateAccountsPayableAging);
router.get('/expenses-by-vendor', generateExpensesByVendor);
router.get('/expenses-by-category', generateExpensesByCategory);

// Sales Reports
router.get('/sales-by-product', generateSalesByProduct);

// Tax Reports
router.get('/tax-summary', generateTaxSummary);

module.exports = router;
