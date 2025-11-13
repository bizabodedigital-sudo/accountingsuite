const taxService = require('../services/taxService');
const logger = require('../config/logger');

// @desc    Calculate tax
// @route   POST /api/tax/calculate
// @access  Private
const calculateTax = async (req, res) => {
  try {
    const { subtotal, taxType, customRate } = req.body;

    if (!subtotal || subtotal < 0) {
      return res.status(400).json({
        success: false,
        error: 'Subtotal must be a positive number'
      });
    }

    const calculation = taxService.calculateGCT(subtotal, taxType || 'STANDARD', customRate);

    res.status(200).json({
      success: true,
      data: calculation
    });
  } catch (error) {
    logger.error('Calculate tax error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate tax'
    });
  }
};

// @desc    Calculate multi-item tax
// @route   POST /api/tax/calculate-multi
// @access  Private
const calculateMultiItemTax = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const calculation = taxService.calculateMultiItemTax(items);

    res.status(200).json({
      success: true,
      data: calculation
    });
  } catch (error) {
    logger.error('Calculate multi-item tax error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate tax'
    });
  }
};

// @desc    Check GCT registration status
// @route   POST /api/tax/check-registration
// @access  Private
const checkGCTRegistration = async (req, res) => {
  try {
    const { annualTurnover } = req.body;

    if (!annualTurnover || annualTurnover < 0) {
      return res.status(400).json({
        success: false,
        error: 'Annual turnover must be a positive number'
      });
    }

    const result = taxService.checkGCTRegistration(annualTurnover);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Check GCT registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check GCT registration'
    });
  }
};

// @desc    Validate TRN
// @route   POST /api/tax/validate-trn
// @access  Private
const validateTRN = async (req, res) => {
  try {
    const { trn } = req.body;

    if (!trn) {
      return res.status(400).json({
        success: false,
        error: 'TRN is required'
      });
    }

    const isValid = taxService.validateTRN(trn);
    const formatted = isValid ? taxService.formatTRN(trn) : null;

    res.status(200).json({
      success: true,
      data: {
        isValid,
        trn,
        formatted
      }
    });
  } catch (error) {
    logger.error('Validate TRN error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate TRN'
    });
  }
};

module.exports = {
  calculateTax,
  calculateMultiItemTax,
  checkGCTRegistration,
  validateTRN
};

