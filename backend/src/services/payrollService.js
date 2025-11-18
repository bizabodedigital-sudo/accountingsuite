/**
 * Payroll Service
 * Handles payroll calculations for Jamaican tax deductions
 */

// Jamaican Tax Constants (2024 rates - update as needed)
const NIS_RATE = 0.03; // 3% of gross pay
const MAX_NIS_CONTRIBUTION = 5000; // Maximum monthly NIS contribution
const NHT_RATE = 0.02; // 2% of gross pay
const MAX_NHT_CONTRIBUTION = 3000; // Maximum monthly NHT contribution
const EDUCATION_TAX_RATE = 0.0225; // 2.25% of gross pay

// PAYE Tax Brackets (2024 - example, update with actual rates)
const PAYE_BRACKETS = [
  { min: 0, max: 1500000, rate: 0 }, // Tax-free threshold
  { min: 1500000, max: 6000000, rate: 0.25 }, // 25% bracket
  { min: 6000000, max: Infinity, rate: 0.30 } // 30% bracket
];

class PayrollService {
  /**
   * Calculate NIS (National Insurance Scheme) contribution
   * @param {number} grossPay - Monthly gross pay
   * @returns {number} NIS contribution
   */
  static calculateNIS(grossPay) {
    const contribution = grossPay * NIS_RATE;
    return Math.min(contribution, MAX_NIS_CONTRIBUTION);
  }

  /**
   * Calculate NHT (National Housing Trust) contribution
   * @param {number} grossPay - Monthly gross pay
   * @returns {number} NHT contribution
   */
  static calculateNHT(grossPay) {
    const contribution = grossPay * NHT_RATE;
    return Math.min(contribution, MAX_NHT_CONTRIBUTION);
  }

  /**
   * Calculate Education Tax
   * @param {number} grossPay - Monthly gross pay
   * @returns {number} Education Tax
   */
  static calculateEducationTax(grossPay) {
    return grossPay * EDUCATION_TAX_RATE;
  }

  /**
   * Calculate PAYE (Pay As You Earn - Income Tax)
   * @param {number} monthlyGross - Monthly gross pay
   * @param {object} employee - Employee object (optional, for additional calculations)
   * @returns {number} PAYE amount
   */
  static calculatePAYE(monthlyGross, employee = null) {
    const annualGross = monthlyGross * 12;
    
    let tax = 0;
    let remainingIncome = annualGross;

    // Calculate tax using progressive brackets
    for (let i = PAYE_BRACKETS.length - 1; i >= 0; i--) {
      const bracket = PAYE_BRACKETS[i];
      
      if (remainingIncome > bracket.min) {
        const taxableInThisBracket = Math.min(
          remainingIncome - bracket.min,
          bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min
        );
        tax += taxableInThisBracket * bracket.rate;
        remainingIncome = bracket.min;
      }
    }

    // Return monthly PAYE
    return tax / 12;
  }

  /**
   * Calculate all deductions
   * @param {number} grossPay - Monthly gross pay
   * @param {object} employee - Employee object
   * @returns {object} Deductions breakdown
   */
  static calculateDeductions(grossPay, employee = null) {
    const deductions = {
      nis: this.calculateNIS(grossPay),
      nht: this.calculateNHT(grossPay),
      educationTax: this.calculateEducationTax(grossPay),
      paye: this.calculatePAYE(grossPay, employee),
      other: 0 // For additional deductions
    };

    return deductions;
  }

  /**
   * Calculate net pay
   * @param {number} grossPay - Monthly gross pay
   * @param {object} deductions - Deductions object
   * @returns {number} Net pay
   */
  static calculateNetPay(grossPay, deductions) {
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
    return grossPay - totalDeductions;
  }

  /**
   * Calculate payroll for an employee
   * @param {object} employee - Employee object
   * @param {number} grossPay - Gross pay (or use employee salary)
   * @param {object} overrides - Override deductions if needed
   * @returns {object} Complete payroll calculation
   */
  static calculatePayroll(employee, grossPay = null, overrides = {}) {
    const monthlyGross = grossPay || employee.salary || 0;
    
    const deductions = {
      ...this.calculateDeductions(monthlyGross, employee),
      ...overrides
    };

    const netPay = this.calculateNetPay(monthlyGross, deductions);

    return {
      grossPay: monthlyGross,
      deductions,
      netPay,
      breakdown: {
        grossPay: monthlyGross,
        nis: deductions.nis,
        nht: deductions.nht,
        educationTax: deductions.educationTax,
        paye: deductions.paye,
        otherDeductions: deductions.other,
        totalDeductions: Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0),
        netPay
      }
    };
  }
}

// Export constants for testing
PayrollService.NIS_RATE = NIS_RATE;
PayrollService.MAX_NIS_CONTRIBUTION = MAX_NIS_CONTRIBUTION;
PayrollService.NHT_RATE = NHT_RATE;
PayrollService.MAX_NHT_CONTRIBUTION = MAX_NHT_CONTRIBUTION;
PayrollService.EDUCATION_TAX_RATE = EDUCATION_TAX_RATE;
PayrollService.PAYE_BRACKETS = PAYE_BRACKETS;

module.exports = PayrollService;




