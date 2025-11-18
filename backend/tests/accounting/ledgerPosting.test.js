const AccountingEngine = require('../../src/services/accountingEngine');
const ChartOfAccount = require('../../src/models/ChartOfAccount');
const JournalEntry = require('../../src/models/JournalEntry');
const LedgerEntry = require('../../src/models/LedgerEntry');
const { createTestUser } = require('../utils/testHelpers');

describe('Ledger Posting', () => {
  let tenantId;
  let userId;
  let cashAccount;
  let salesAccount;
  let arAccount;

  beforeAll(async () => {
    const { user, tenant } = await createTestUser();
    tenantId = tenant._id;
    userId = user._id;

    // Create test accounts
    cashAccount = await ChartOfAccount.create({
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      tenantId,
      isActive: true,
      currentBalance: 0
    });

    salesAccount = await ChartOfAccount.create({
      code: '4000',
      name: 'Sales Income',
      type: 'INCOME',
      normalBalance: 'CREDIT',
      tenantId,
      isActive: true,
      currentBalance: 0
    });

    arAccount = await ChartOfAccount.create({
      code: '1200',
      name: 'Accounts Receivable',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      tenantId,
      isActive: true,
      currentBalance: 0
    });
  });

  describe('Journal Entry Posting', () => {
    it('should create ledger entries when journal entry is posted', async () => {
      const journalData = {
        entryDate: new Date(),
        description: 'Test posting',
        entries: [
          {
            accountId: cashAccount._id,
            debit: 1000,
            credit: 0
          },
          {
            accountId: salesAccount._id,
            debit: 0,
            credit: 1000
          }
        ],
        entryType: 'MANUAL',
        tenantId,
        userId
      };

      const journalEntry = await AccountingEngine.createJournalEntry(journalData);

      // Check ledger entries were created
      const ledgerEntries = await LedgerEntry.find({
        journalEntryId: journalEntry._id,
        tenantId
      });

      expect(ledgerEntries.length).toBe(2);
      
      // Check cash account debit
      const cashEntry = ledgerEntries.find(
        le => le.accountId.toString() === cashAccount._id.toString() && le.entryType === 'DEBIT'
      );
      expect(cashEntry).toBeDefined();
      expect(cashEntry.amount).toBe(1000);

      // Check sales account credit
      const salesEntry = ledgerEntries.find(
        le => le.accountId.toString() === salesAccount._id.toString() && le.entryType === 'CREDIT'
      );
      expect(salesEntry).toBeDefined();
      expect(salesEntry.amount).toBe(1000);
    });

    it('should update account balances when posting', async () => {
      const initialCashBalance = cashAccount.currentBalance || 0;
      const initialSalesBalance = salesAccount.currentBalance || 0;

      const journalData = {
        entryDate: new Date(),
        description: 'Balance update test',
        entries: [
          {
            accountId: cashAccount._id,
            debit: 500,
            credit: 0
          },
          {
            accountId: salesAccount._id,
            debit: 0,
            credit: 500
          }
        ],
        entryType: 'MANUAL',
        tenantId,
        userId
      };

      await AccountingEngine.createJournalEntry(journalData);

      // Refresh accounts
      const updatedCash = await ChartOfAccount.findById(cashAccount._id);
      const updatedSales = await ChartOfAccount.findById(salesAccount._id);

      expect(updatedCash.currentBalance).toBe(initialCashBalance + 500);
      expect(updatedSales.currentBalance).toBe(initialSalesBalance + 500);
    });
  });

  describe('Invoice Posting', () => {
    it('should create correct ledger entries for invoice', async () => {
      const invoice = {
        _id: 'test-invoice-123',
        number: 'INV-001',
        total: 1150,
        tax: 150,
        subtotal: 1000,
        customerId: 'test-customer',
        tenantId
      };

      const result = await AccountingEngine.createInvoiceEntry(invoice);

      // Check AR was debited
      const arEntries = await LedgerEntry.find({
        accountId: arAccount._id,
        tenantId,
        'sourceDocument.type': 'INVOICE'
      });

      expect(arEntries.length).toBeGreaterThan(0);
      const arEntry = arEntries.find(e => e.entryType === 'DEBIT');
      expect(arEntry).toBeDefined();
      expect(arEntry.amount).toBe(1150);
    });
  });
});




