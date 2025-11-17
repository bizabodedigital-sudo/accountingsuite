const express = require('express');
const {
  getClientInvoices,
  getClientInvoice,
  getClientQuotes,
  getClientPayments,
  getClientDashboard
} = require('../controllers/clientPortalController');
const { protect, tenantFilter } = require('../middleware/clientAuth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

router.get('/dashboard', getClientDashboard);
router.get('/invoices', getClientInvoices);
router.get('/invoices/:id', getClientInvoice);
router.get('/quotes', getClientQuotes);
router.get('/payments', getClientPayments);

module.exports = router;
