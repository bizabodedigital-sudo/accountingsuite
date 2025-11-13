const express = require('express');
const {
  getCurrencies,
  getCurrency,
  convertCurrency,
  updateExchangeRates,
  initializeCurrencies
} = require('../controllers/currencyController');
const { protect, authorize, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Currency routes
router.route('/')
  .get(getCurrencies);

router.route('/convert')
  .post(convertCurrency);

router.route('/rates')
  .put(authorize('OWNER', 'ACCOUNTANT'), updateExchangeRates);

router.route('/initialize')
  .post(authorize('OWNER'), initializeCurrencies);

router.route('/:code')
  .get(getCurrency);

module.exports = router;

