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
  generateGeneralLedger,
  generateCustomerProfitability,
  generateBudgetVsActual,
  generateOwnersEquity,
  generateCashFlowDirect,
  generateCashFlowIndirect,
  generateProjectProfitability
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
router.get('/general-ledger', generateGeneralLedger);

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

// Advanced Reports
router.get('/budget-vs-actual', generateBudgetVsActual);
router.get('/owners-equity', generateOwnersEquity);
router.get('/cash-flow-direct', generateCashFlowDirect);
router.get('/cash-flow-indirect', generateCashFlowIndirect);
router.get('/project-profitability', generateProjectProfitability);

module.exports = router;
