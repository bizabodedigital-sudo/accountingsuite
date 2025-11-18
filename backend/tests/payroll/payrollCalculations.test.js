const PayrollService = require('../../src/services/payrollService');
const { createTestUser } = require('../utils/testHelpers');

describe('Payroll Calculations', () => {
  let tenantId;

  beforeAll(async () => {
    const { tenant } = await createTestUser();
    tenantId = tenant._id;
  });

  describe('NIS Calculation', () => {
    it('should calculate NIS at 3% of gross pay', () => {
      const grossPay = 50000;
      const nis = PayrollService.calculateNIS(grossPay);
      expect(nis).toBe(1500); // 3% of 50000
    });

    it('should cap NIS at maximum contribution', () => {
      const grossPay = 1000000;
      const nis = PayrollService.calculateNIS(grossPay);
      expect(nis).toBeLessThanOrEqual(PayrollService.MAX_NIS_CONTRIBUTION);
    });
  });

  describe('NHT Calculation', () => {
    it('should calculate NHT at 2% of gross pay', () => {
      const grossPay = 50000;
      const nht = PayrollService.calculateNHT(grossPay);
      expect(nht).toBe(1000); // 2% of 50000
    });
  });

  describe('Education Tax Calculation', () => {
    it('should calculate Education Tax at 2.25% of gross pay', () => {
      const grossPay = 50000;
      const educationTax = PayrollService.calculateEducationTax(grossPay);
      expect(educationTax).toBe(1125); // 2.25% of 50000
    });
  });

  describe('PAYE Calculation', () => {
    it('should calculate PAYE based on tax brackets', () => {
      const monthlyGross = 100000;
      const paye = PayrollService.calculatePAYE(monthlyGross);
      expect(paye).toBeGreaterThan(0);
      expect(paye).toBeLessThan(monthlyGross);
    });

    it('should return 0 for income below tax threshold', () => {
      const monthlyGross = 10000; // Below threshold
      const paye = PayrollService.calculatePAYE(monthlyGross);
      expect(paye).toBe(0);
    });
  });

  describe('Net Pay Calculation', () => {
    it('should calculate net pay correctly', () => {
      const grossPay = 50000;
      const deductions = {
        nis: 1500,
        nht: 1000,
        educationTax: 1125,
        paye: 5000
      };

      const netPay = PayrollService.calculateNetPay(grossPay, deductions);
      expect(netPay).toBe(41375); // 50000 - 1500 - 1000 - 1125 - 5000
    });
  });
});




