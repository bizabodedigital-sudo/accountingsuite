const logger = require('../config/logger');

/**
 * Jamaican Tax Calculation Service
 * Handles GCT (General Consumption Tax) and other Jamaican tax calculations
 */
class TaxService {
  constructor() {
    // Jamaican tax rates
    this.GCT_RATE = 0.15; // 15% General Consumption Tax
    this.STANDARD_RATE = 0.15; // Standard rate
    this.ZERO_RATE = 0; // Zero-rated items
    this.EXEMPT = null; // Exempt items (no tax)
    
    // Tax thresholds (in JMD)
    this.REGISTRATION_THRESHOLD = 3000000; // Annual threshold for GCT registration
  }

  /**
   * Calculate GCT for Jamaican businesses
   * @param {Number} subtotal - Subtotal amount
   * @param {String} taxType - Type of tax calculation ('STANDARD', 'ZERO', 'EXEMPT', 'CUSTOM')
   * @param {Number} customRate - Custom tax rate (0-100) if taxType is 'CUSTOM'
   * @returns {Object} Tax calculation result
   */
  calculateGCT(subtotal, taxType = 'STANDARD', customRate = null) {
    try {
      if (!subtotal || subtotal < 0) {
        throw new Error('Subtotal must be a positive number');
      }

      let taxRate = 0;
      let taxAmount = 0;

      switch (taxType.toUpperCase()) {
        case 'STANDARD':
          taxRate = this.STANDARD_RATE;
          taxAmount = subtotal * taxRate;
          break;
        
        case 'ZERO':
          taxRate = this.ZERO_RATE;
          taxAmount = 0;
          break;
        
        case 'EXEMPT':
          taxRate = 0;
          taxAmount = 0;
          break;
        
        case 'CUSTOM':
          if (customRate === null || customRate < 0 || customRate > 100) {
            throw new Error('Custom rate must be between 0 and 100');
          }
          taxRate = customRate / 100;
          taxAmount = subtotal * taxRate;
          break;
        
        default:
          throw new Error(`Invalid tax type: ${taxType}`);
      }

      const total = subtotal + taxAmount;

      return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxRate: parseFloat((taxRate * 100).toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        taxType: taxType.toUpperCase(),
        currency: 'JMD'
      };
    } catch (error) {
      logger.error('GCT calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for multiple items with different tax rates
   * @param {Array} items - Array of items with subtotal and taxType
   * @returns {Object} Combined tax calculation
   */
  calculateMultiItemTax(items) {
    try {
      let totalSubtotal = 0;
      let totalTax = 0;
      const itemTaxes = [];

      items.forEach((item, index) => {
        const calculation = this.calculateGCT(
          item.subtotal,
          item.taxType || 'STANDARD',
          item.customRate
        );
        
        totalSubtotal += calculation.subtotal;
        totalTax += calculation.taxAmount;
        
        itemTaxes.push({
          itemIndex: index,
          ...calculation
        });
      });

      return {
        items: itemTaxes,
        subtotal: parseFloat(totalSubtotal.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        total: parseFloat((totalSubtotal + totalTax).toFixed(2)),
        currency: 'JMD'
      };
    } catch (error) {
      logger.error('Multi-item tax calculation error:', error);
      throw error;
    }
  }

  /**
   * Check if business needs GCT registration based on annual turnover
   * @param {Number} annualTurnover - Annual turnover in JMD
   * @returns {Object} Registration status
   */
  checkGCTRegistration(annualTurnover) {
    const needsRegistration = annualTurnover >= this.REGISTRATION_THRESHOLD;
    
    return {
      needsRegistration,
      threshold: this.REGISTRATION_THRESHOLD,
      currentTurnover: annualTurnover,
      difference: needsRegistration 
        ? 0 
        : this.REGISTRATION_THRESHOLD - annualTurnover,
      message: needsRegistration
        ? 'Business must register for GCT'
        : `Business is below GCT registration threshold by JMD ${(this.REGISTRATION_THRESHOLD - annualTurnover).toLocaleString('en-JM')}`
    };
  }

  /**
   * Calculate tax breakdown for invoice display
   * @param {Number} subtotal - Subtotal amount
   * @param {String} taxType - Type of tax
   * @param {Number} customRate - Custom rate if applicable
   * @returns {Object} Detailed tax breakdown
   */
  getTaxBreakdown(subtotal, taxType = 'STANDARD', customRate = null) {
    const calculation = this.calculateGCT(subtotal, taxType, customRate);
    
    return {
      ...calculation,
      breakdown: {
        taxableAmount: calculation.subtotal,
        taxRate: `${calculation.taxRate}%`,
        taxAmount: calculation.taxAmount,
        totalAmount: calculation.total
      },
      description: this.getTaxDescription(taxType)
    };
  }

  /**
   * Get human-readable tax description
   * @param {String} taxType - Type of tax
   * @returns {String} Description
   */
  getTaxDescription(taxType) {
    const descriptions = {
      'STANDARD': 'General Consumption Tax (GCT) - 15%',
      'ZERO': 'Zero-Rated (0% GCT)',
      'EXEMPT': 'GCT Exempt',
      'CUSTOM': 'Custom Tax Rate'
    };
    
    return descriptions[taxType.toUpperCase()] || 'Tax';
  }

  /**
   * Validate tax registration number format (Jamaican TRN)
   * @param {String} trn - Tax Registration Number
   * @returns {Boolean} Is valid
   */
  validateTRN(trn) {
    if (!trn || typeof trn !== 'string') {
      return false;
    }
    
    // Jamaican TRN format: 9 digits, sometimes with dashes
    const cleaned = trn.replace(/[-\s]/g, '');
    return /^\d{9}$/.test(cleaned);
  }

  /**
   * Format TRN for display
   * @param {String} trn - Tax Registration Number
   * @returns {String} Formatted TRN
   */
  formatTRN(trn) {
    if (!trn) return '';
    const cleaned = trn.replace(/[-\s]/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return trn;
  }
}

module.exports = new TaxService();

