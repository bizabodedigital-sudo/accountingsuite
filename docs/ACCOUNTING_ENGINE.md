# Accounting Engine Documentation

## Overview

The Bizabode Accounting Engine is the core financial system that implements **double-entry bookkeeping** principles. Every financial transaction creates balanced journal entries that maintain the fundamental accounting equation:

```
Assets = Liabilities + Equity
```

---

## Core Concepts

### 1. Chart of Accounts (COA)

The Chart of Accounts is the foundation of the accounting system. It organizes all accounts into five main categories:

- **Assets**: What the business owns (Cash, Accounts Receivable, Inventory, Fixed Assets)
- **Liabilities**: What the business owes (Accounts Payable, Loans, GCT Payable)
- **Equity**: Owner's stake in the business (Capital, Retained Earnings)
- **Income**: Revenue sources (Sales Income, Service Income)
- **Expense**: Business costs (Rent, Salaries, Utilities)

#### Account Structure

```javascript
{
  code: "1000",           // Unique account code
  name: "Cash",           // Account name
  type: "ASSET",          // Account type
  normalBalance: "DEBIT", // Normal balance side
  parentAccountId: null,  // For hierarchical structure
  isSystem: false,        // System accounts cannot be deleted
  isActive: true
}
```

#### Normal Balances

- **Assets**: Debit (increases with debits)
- **Liabilities**: Credit (increases with credits)
- **Equity**: Credit (increases with credits)
- **Income**: Credit (increases with credits)
- **Expense**: Debit (increases with debits)

---

## 2. Journal Entries

Journal entries are the building blocks of the accounting system. Every transaction must have **equal debits and credits**.

### Structure

```javascript
{
  entryNumber: "JE-2024-001",
  transactionDate: "2024-01-15",
  description: "Payment received for invoice INV-001",
  lines: [
    {
      accountId: "1000",  // Cash account
      entryType: "DEBIT",
      amount: 1000.00,
      description: "Payment received"
    },
    {
      accountId: "1200",  // Accounts Receivable
      entryType: "CREDIT",
      amount: 1000.00,
      description: "Invoice payment"
    }
  ],
  isPosted: true,
  postedAt: "2024-01-15T10:30:00Z"
}
```

### Validation Rules

1. **Debits must equal credits**: `sum(debits) === sum(credits)`
2. **At least two lines**: Minimum one debit and one credit
3. **Valid accounts**: All accounts must exist and be active
4. **Period not locked**: Cannot post to locked financial periods

---

## 3. Ledger Entries

Ledger entries are the **posted** journal entry lines, aggregated by account for fast reporting.

### Structure

```javascript
{
  accountId: "1000",
  entryType: "DEBIT",
  amount: 1000.00,
  transactionDate: "2024-01-15",
  journalEntryId: "je123",
  reference: "INV-001",
  description: "Payment received"
}
```

### Purpose

- **Fast reporting**: Pre-aggregated for Trial Balance, P&L, Balance Sheet
- **Account history**: Complete transaction history per account
- **Audit trail**: Links back to source journal entries

---

## 4. Financial Periods

Financial periods enforce **period-based accounting** and prevent modification of closed periods.

### Period States

- **OPEN**: Can create/modify transactions
- **CLOSED**: Read-only, cannot modify
- **LOCKED**: Cannot reopen (Owner role only)

### Period Locking Flow

1. User creates transactions in OPEN period
2. Period is closed (prevents new transactions)
3. Period is locked (prevents reopening)
4. Reports are finalized for that period

---

## 5. Opening Balances

Opening balances initialize accounts with starting values. They create special journal entries tagged as `openingBalance: true`.

### Flow

1. User sets opening balance for an account
2. System creates unposted journal entry
3. User reviews and posts opening balances
4. System creates ledger entries
5. Opening balances appear in reports

### Example

```javascript
// Opening balance for Cash account
{
  accountId: "1000",
  amount: 50000.00,
  entryType: "DEBIT",
  transactionDate: "2024-01-01",
  isOpeningBalance: true
}
```

---

## Transaction Flows

### Invoice Creation

When an invoice is **sent** (status = SENT), the system automatically creates journal entries:

```
DEBIT  Accounts Receivable    $1,000.00
CREDIT Sales Income           $850.00
CREDIT GCT Payable            $150.00
```

**Code Location**: `backend/src/services/accountingEngine.js` → `createInvoiceEntry()`

### Payment Received

When a payment is recorded:

```
DEBIT  Cash/Bank              $1,000.00
CREDIT Accounts Receivable    $1,000.00
```

**Code Location**: `backend/src/services/accountingEngine.js` → `createPaymentEntry()`

### Expense Recorded

When an expense is created:

```
DEBIT  Expense Account        $500.00
DEBIT  GCT Recoverable        $75.00
CREDIT Cash/Bank              $575.00
```

**Code Location**: `backend/src/services/accountingEngine.js` → `createExpenseEntry()`

### Payroll Posted

When payroll is posted:

```
DEBIT  Salaries Expense       $5,000.00
CREDIT Cash/Bank              $3,500.00
CREDIT NIS Payable            $250.00
CREDIT NHT Payable            $250.00
CREDIT Education Tax Payable  $500.00
CREDIT PAYE Payable           $500.00
```

**Code Location**: `backend/src/services/accountingEngine.js` → `createPayrollEntry()`

---

## Accounting Engine Service

### Location

`backend/src/services/accountingEngine.js`

### Key Methods

#### `createJournalEntry(journalEntryData)`
Creates a journal entry and validates:
- Debits equal credits
- Accounts exist and are active
- Period is not locked

#### `createInvoiceEntry(invoice)`
Automatically creates journal entries when invoice is sent:
- Debits Accounts Receivable
- Credits Sales Income
- Credits GCT Payable (if applicable)

#### `createPaymentEntry(payment)`
Creates journal entries for payments:
- Debits Cash/Bank
- Credits Accounts Receivable

#### `createExpenseEntry(expense)`
Creates journal entries for expenses:
- Debits Expense Account
- Debits GCT Recoverable (if applicable)
- Credits Cash/Bank or Accounts Payable

#### `createPayrollEntry(payroll)`
Creates journal entries for payroll:
- Debits Salaries Expense
- Credits Cash/Bank
- Credits various tax payables (NIS, NHT, Education Tax, PAYE)

---

## Period Locking Middleware

### Location

`backend/src/middleware/periodLock.js`

### Functionality

- Checks if transaction date falls in a locked period
- Blocks POST/PUT/DELETE operations on locked periods
- Returns clear error messages

### Usage

```javascript
router.post('/journal-entries', periodLock, createJournalEntry);
```

---

## Reports

All financial reports are generated from **ledger entries**, not journal entries directly. This ensures:
- Fast query performance
- Accurate account balances
- Real-time reporting

### Trial Balance

Aggregates all ledger entries by account up to a specific date:

```javascript
SELECT accountId, 
       SUM(CASE WHEN entryType = 'DEBIT' THEN amount ELSE -amount END) as balance
FROM ledger_entries
WHERE transactionDate <= :asOfDate
GROUP BY accountId
```

### Profit & Loss

Uses Income and Expense accounts:

```javascript
SELECT accountId, 
       SUM(CASE WHEN entryType = 'CREDIT' THEN amount ELSE -amount END) as income
FROM ledger_entries
WHERE account.type = 'INCOME'
  AND transactionDate BETWEEN :startDate AND :endDate
```

### Balance Sheet

Uses Assets, Liabilities, and Equity accounts:

```javascript
SELECT accountId,
       SUM(CASE WHEN entryType = 'DEBIT' THEN amount ELSE -amount END) as balance
FROM ledger_entries
WHERE account.type IN ('ASSET', 'LIABILITY', 'EQUITY')
  AND transactionDate <= :asOfDate
```

---

## Validation Rules

### System-Level Validations

1. **Balanced Entries**: All journal entries must balance
2. **Valid Accounts**: Accounts must exist and be active
3. **Period Locking**: Cannot modify locked periods
4. **Account Types**: Debits/credits must match account type
5. **System Accounts**: Cannot delete accounts with transactions

### Business Rules

1. **Opening Balances**: Must be posted before regular transactions
2. **Invoice Posting**: Only SENT or PAID invoices create entries
3. **Payment Matching**: Payments must match invoice amounts
4. **Period Dates**: Transaction dates must be within open periods

---

## Error Handling

The accounting engine uses **graceful degradation**:

- If COA is not set up, transactions still work (entries are queued)
- If accounts are missing, clear error messages are shown
- If period is locked, user-friendly warnings are displayed

---

## Testing

### Unit Tests

Test individual methods:
- `createJournalEntry()` validation
- `createInvoiceEntry()` posting logic
- Period locking checks

### Integration Tests

Test full flows:
- Invoice creation → Journal entry → Ledger entry → Report
- Payment → Invoice update → Ledger entry
- Payroll → Approval → Posting → Ledger entry

### E2E Tests

Test complete scenarios:
- Setup COA → Opening balances → Transactions → Reports
- Financial period lifecycle (Open → Close → Lock)

---

## Common Issues & Solutions

### Issue: "Unbalanced journal entry"
**Solution**: Ensure debits equal credits. Check all line items.

### Issue: "Period is locked"
**Solution**: Cannot modify transactions in locked periods. Create in current period.

### Issue: "Account not found"
**Solution**: Ensure account exists and is active. Check account code.

### Issue: "System account cannot be deleted"
**Solution**: System accounts are protected. Mark as inactive instead.

---

## Future Enhancements

- [ ] Multi-currency journal entries
- [ ] Recurring journal entries
- [ ] Journal entry templates
- [ ] Batch posting
- [ ] Reversing entries
- [ ] Accrual adjustments

---

## Related Documentation

- `PAYROLL_LOGIC.md` - Payroll calculations and deductions
- `ASSET_DEPRECIATION_FLOW.md` - Fixed asset depreciation
- `WORKFLOW_AUTOMATION_ENGINE.md` - Automated workflow system
- `INTEGRATIONS_OVERVIEW.md` - Payment gateways and integrations




