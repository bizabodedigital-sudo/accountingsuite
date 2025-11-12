const express = require('express');
const router = express.Router();
const {
  getRecurringInvoices,
  getRecurringInvoice,
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  toggleRecurringInvoiceStatus,
  generateInvoiceFromRecurring,
  duplicateRecurringInvoice,
  downloadRecurringInvoicePDF
} = require('../controllers/recurringInvoiceController');
const { protect, tenantFilter } = require('../middleware/auth');

// All routes are protected and tenant-filtered
router.use(protect);
router.use(tenantFilter());

// @route   GET /api/recurring-invoices
// @desc    Get all recurring invoices
// @access  Private
router.get('/', getRecurringInvoices);

// @route   GET /api/recurring-invoices/:id
// @desc    Get single recurring invoice
// @access  Private
router.get('/:id', getRecurringInvoice);

// @route   POST /api/recurring-invoices
// @desc    Create new recurring invoice
// @access  Private
router.post('/', createRecurringInvoice);

// @route   PUT /api/recurring-invoices/:id
// @desc    Update recurring invoice
// @access  Private
router.put('/:id', updateRecurringInvoice);

// @route   DELETE /api/recurring-invoices/:id
// @desc    Delete recurring invoice
// @access  Private
router.delete('/:id', deleteRecurringInvoice);

// @route   POST /api/recurring-invoices/:id/toggle-status
// @desc    Toggle recurring invoice status (Active/Paused)
// @access  Private
router.post('/:id/toggle-status', toggleRecurringInvoiceStatus);

// @route   POST /api/recurring-invoices/:id/generate
// @desc    Generate invoice from recurring template
// @access  Private
router.post('/:id/generate', generateInvoiceFromRecurring);

// @route   POST /api/recurring-invoices/:id/duplicate
// @desc    Duplicate recurring invoice
// @access  Private
router.post('/:id/duplicate', duplicateRecurringInvoice);

// @route   GET /api/recurring-invoices/:id/pdf
// @desc    Download recurring invoice PDF (preview)
// @access  Private
router.get('/:id/pdf', downloadRecurringInvoicePDF);

module.exports = router;


