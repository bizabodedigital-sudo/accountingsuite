const express = require('express');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  voidInvoice,
  downloadInvoicePDF
} = require('../controllers/invoiceController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Invoice routes
router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.route('/:id/send')
  .post(sendInvoice);

router.route('/:id/void')
  .post(voidInvoice);

router.route('/:id/pdf')
  .get(downloadInvoicePDF);

module.exports = router;




