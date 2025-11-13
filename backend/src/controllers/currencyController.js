const Currency = require('../models/Currency');
const logger = require('../config/logger');

// @desc    Get all currencies
// @route   GET /api/currencies
// @access  Private
const getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find({ isActive: true }).sort({ code: 1 });

    res.status(200).json({
      success: true,
      data: currencies
    });
  } catch (error) {
    logger.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get currencies'
    });
  }
};

// @desc    Get single currency
// @route   GET /api/currencies/:code
// @access  Private
const getCurrency = async (req, res) => {
  try {
    const currency = await Currency.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        error: 'Currency not found'
      });
    }

    res.status(200).json({
      success: true,
      data: currency
    });
  } catch (error) {
    logger.error('Get currency error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get currency'
    });
  }
};

// @desc    Convert currency
// @route   POST /api/currencies/convert
// @access  Private
const convertCurrency = async (req, res) => {
  try {
    const { amount, fromCode, toCode } = req.body;

    if (!amount || !fromCode || !toCode) {
      return res.status(400).json({
        success: false,
        error: 'Amount, fromCode, and toCode are required'
      });
    }

    const convertedAmount = await Currency.convert(amount, fromCode, toCode);

    res.status(200).json({
      success: true,
      data: {
        amount: parseFloat(amount),
        fromCode: fromCode.toUpperCase(),
        toCode: toCode.toUpperCase(),
        convertedAmount: parseFloat(convertedAmount.toFixed(2))
      }
    });
  } catch (error) {
    logger.error('Convert currency error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert currency'
    });
  }
};

// @desc    Update exchange rates
// @route   PUT /api/currencies/rates
// @access  Private (OWNER, ACCOUNTANT)
const updateExchangeRates = async (req, res) => {
  try {
    const { rates } = req.body;

    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Rates object is required'
      });
    }

    const result = await Currency.updateExchangeRates(rates, req.user._id.toString());

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Update exchange rates error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update exchange rates'
    });
  }
};

// @desc    Initialize default currencies
// @route   POST /api/currencies/initialize
// @access  Private (OWNER only)
const initializeCurrencies = async (req, res) => {
  try {
    const defaultCurrencies = [
      { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', exchangeRate: 1, baseCurrency: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0064 },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0059 },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.0050 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 0.0087 }
    ];

    for (const currency of defaultCurrencies) {
      await Currency.findOneAndUpdate(
        { code: currency.code },
        currency,
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Currencies initialized successfully'
    });
  } catch (error) {
    logger.error('Initialize currencies error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize currencies'
    });
  }
};

module.exports = {
  getCurrencies,
  getCurrency,
  convertCurrency,
  updateExchangeRates,
  initializeCurrencies
};

