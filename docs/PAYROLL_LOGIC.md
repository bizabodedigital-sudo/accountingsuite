# Payroll Logic Documentation

## Overview

The Bizabode Payroll system handles employee compensation with automatic calculation of Jamaican tax deductions including NIS, NHT, Education Tax, and PAYE (Income Tax).

---

## Jamaican Tax Structure

### 1. NIS (National Insurance Scheme)
- **Rate**: 3% of gross pay (employee contribution)
- **Maximum**: Capped at a maximum insurable earnings amount
- **Calculation**: `min(grossPay * 0.03, maxNISContribution)`

### 2. NHT (National Housing Trust)
- **Rate**: 2% of gross pay (employee contribution)
- **Maximum**: Capped at a maximum contribution amount
- **Calculation**: `min(grossPay * 0.02, maxNHTContribution)`

### 3. Education Tax
- **Rate**: 2.25% of gross pay (employee contribution)
- **Calculation**: `grossPay * 0.0225`

### 4. PAYE (Pay As You Earn - Income Tax)
- **Rate**: Progressive tax brackets
- **Calculation**: Based on annual income and tax brackets
- **Monthly Calculation**: Annual tax / 12

---

## Payroll Flow

### 1. Employee Setup

```javascript
{
  employeeNumber: "EMP-001",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "876-123-4567",
  hireDate: "2024-01-01",
  salary: 50000, // Monthly gross salary
  taxId: "123456789", // TRN
  nisNumber: "NIS-123456",
  nhtNumber: "NHT-123456",
  status: "ACTIVE"
}
```

### 2. Payroll Creation

When creating a payroll:

```javascript
{
  employeeId: "emp123",
  payPeriodStart: "2024-01-01",
  payPeriodEnd: "2024-01-31",
  payDate: "2024-02-01",
  grossPay: 50000,
  // Deductions calculated automatically
  deductions: {
    nis: 1500,      // 3% of 50000
    nht: 1000,      // 2% of 50000
    educationTax: 1125, // 2.25% of 50000
    paye: 5000      // Based on tax bracket
  },
  netPay: 41375     // grossPay - totalDeductions
}
```

### 3. Deduction Calculation

**Location**: `backend/src/services/payrollService.js`

```javascript
calculateDeductions(grossPay, employee) {
  const deductions = {
    nis: 0,
    nht: 0,
    educationTax: 0,
    paye: 0
  };

  // NIS: 3% of gross pay, capped
  deductions.nis = Math.min(grossPay * 0.03, MAX_NIS_CONTRIBUTION);

  // NHT: 2% of gross pay, capped
  deductions.nht = Math.min(grossPay * 0.02, MAX_NHT_CONTRIBUTION);

  // Education Tax: 2.25% of gross pay
  deductions.educationTax = grossPay * 0.0225;

  // PAYE: Progressive tax calculation
  deductions.paye = this.calculatePAYE(grossPay, employee);

  return deductions;
}
```

### 4. PAYE Calculation

PAYE uses progressive tax brackets:

```javascript
calculatePAYE(monthlyGross, employee) {
  const annualGross = monthlyGross * 12;
  
  // Tax brackets (2024 rates - example)
  let tax = 0;
  
  if (annualGross > 1500000) {
    // 30% on amount over 1.5M
    tax += (annualGross - 1500000) * 0.30;
    annualGross = 1500000;
  }
  
  if (annualGross > 600000) {
    // 25% on amount between 600K and 1.5M
    tax += (annualGross - 600000) * 0.25;
    annualGross = 600000;
  }
  
  if (annualGross > 500000) {
    // 20% on amount between 500K and 600K
    tax += (annualGross - 500000) * 0.20;
  }
  
  // Monthly PAYE
  return tax / 12;
}
```

---

## Payroll Status Flow

1. **DRAFT**: Initial creation, can be edited
2. **APPROVED**: Reviewed and approved, ready for posting
3. **POSTED**: Posted to ledger, cannot be modified
4. **PAID**: Marked as paid (optional status)

### Approval Process

```javascript
// Approve payroll
await Payroll.findByIdAndUpdate(payrollId, {
  status: 'APPROVED',
  approvedBy: userId,
  approvedAt: new Date()
});
```

### Posting to Ledger

When payroll is posted, journal entries are created:

```
DEBIT  Salaries Expense        $50,000.00
CREDIT Cash/Bank               $41,375.00
CREDIT NIS Payable             $1,500.00
CREDIT NHT Payable             $1,000.00
CREDIT Education Tax Payable   $1,125.00
CREDIT PAYE Payable            $5,000.00
```

**Location**: `backend/src/services/accountingEngine.js` → `createPayrollEntry()`

---

## Payroll Model

```javascript
{
  payrollNumber: "PAY-2024-001",
  employeeId: ObjectId,
  payPeriodStart: Date,
  payPeriodEnd: Date,
  payDate: Date,
  grossPay: Number,
  deductions: {
    nis: Number,
    nht: Number,
    educationTax: Number,
    paye: Number,
    other: Number
  },
  netPay: Number,
  status: "DRAFT" | "APPROVED" | "POSTED" | "PAID",
  isPosted: Boolean,
  postedAt: Date,
  tenantId: ObjectId,
  createdBy: ObjectId
}
```

---

## API Endpoints

### Create Payroll
```
POST /api/payroll
```

### Get Payrolls
```
GET /api/payroll?status=APPROVED&employeeId=xxx
```

### Approve Payroll
```
POST /api/payroll/:id/approve
```

### Post Payroll
```
POST /api/payroll/:id/post
```

### Mark as Paid
```
POST /api/payroll/:id/mark-paid
```

---

## Testing

### Unit Tests

Test deduction calculations:

```javascript
describe('Payroll Deductions', () => {
  it('should calculate NIS correctly', () => {
    const grossPay = 50000;
    const nis = calculateNIS(grossPay);
    expect(nis).toBe(1500); // 3% of 50000
  });

  it('should cap NIS at maximum', () => {
    const grossPay = 1000000;
    const nis = calculateNIS(grossPay);
    expect(nis).toBeLessThanOrEqual(MAX_NIS_CONTRIBUTION);
  });
});
```

---

## Common Issues

### Issue: "Deductions don't match expected amounts"
**Solution**: Verify tax rates are up to date. Check employee tax information.

### Issue: "Cannot post payroll"
**Solution**: Ensure payroll is in APPROVED status. Check that Chart of Accounts has required accounts.

### Issue: "PAYE calculation incorrect"
**Solution**: Verify tax brackets are current. Check employee's annual income calculation.

---

## Related Documentation

- `ACCOUNTING_ENGINE.md` - How payroll posts to ledger
- `WORKFLOW_AUTOMATION_ENGINE.md` - Automated payroll workflows




