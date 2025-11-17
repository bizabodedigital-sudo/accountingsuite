const express = require('express');
const router = express.Router();
const {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  approveQuote,
  convertToInvoice,
  deleteQuote
} = require('../controllers/quoteController');
const { protect } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getQuotes)
  .post(createQuote);

router.route('/:id')
  .get(getQuote)
  .put(updateQuote)
  .delete(deleteQuote);

router.route('/:id/approve')
  .post(approveQuote);

router.route('/:id/convert')
  .post(convertToInvoice);

module.exports = router;

