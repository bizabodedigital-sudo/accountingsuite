const AccountingEngine = require('../../src/services/accountingEngine');
const ChartOfAccount = require('../../src/models/ChartOfAccount');
const JournalEntry = require('../../src/models/JournalEntry');
const { createTestUser } = require('../utils/testHelpers');

describe('Accounting Engine', () => {
  let tenantId;
  let cashAccount;
  let salesAccount;
  let arAccount;

  beforeAll(async () => {
    const { tenant } = await createTestUser();
    tenantId = tenant._id;

    // Create test accounts
    cashAccount = await ChartOfAccount.create({
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      tenantId,
      isActive: true
    });

    salesAccount = await ChartOfAccount.create({
      code: '4000',
      name: 'Sales Income',
      type: 'INCOME',
      normalBalance: 'CREDIT',
      tenantId,
      isActive: true
    });

    arAccount = await ChartOfAccount.create({
      code: '1200',
      name: 'Accounts Receivable',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      tenantId,
      isActive: true
    });
  });

  describe('createJournalEntry', () => {
    it('should create a balanced journal entry', async () => {
      const journalData = {
        transactionDate: new Date(),
        description: 'Test entry',
        lines: [
          {
            accountId: cashAccount._id,
            entryType: 'DEBIT',
            amount: 1000
          },
          {
            accountId: salesAccount._id,
            entryType: 'CREDIT',
            amount: 1000
          }
        ],
        tenantId
      };

      const result = await AccountingEngine.createJournalEntry(journalData);

      expect(result).toBeDefined();
      expect(result.isPosted).toBe(true);

      const journal = await JournalEntry.findById(result._id);
      expect(journal).toBeDefined();
      expect(journal.lines.length).toBe(2);
    });

    it('should reject unbalanced journal entries', async () => {
      const journalData = {
        transactionDate: new Date(),
        description: 'Unbalanced entry',
        lines: [
          {
            accountId: cashAccount._id,
            entryType: 'DEBIT',
            amount: 1000
          },
          {
            accountId: salesAccount._id,
            entryType: 'CREDIT',
            amount: 500 // Not balanced!
          }
        ],
        tenantId
      };

      await expect(
        AccountingEngine.createJournalEntry(journalData)
      ).rejects.toThrow();
    });

    it('should reject entries with invalid accounts', async () => {
      const journalData = {
        transactionDate: new Date(),
        description: 'Invalid account',
        lines: [
          {
            accountId: 'invalid-id',
            entryType: 'DEBIT',
            amount: 1000
          },
          {
            accountId: salesAccount._id,
            entryType: 'CREDIT',
            amount: 1000
          }
        ],
        tenantId
      };

      await expect(
        AccountingEngine.createJournalEntry(journalData)
      ).rejects.toThrow();
    });
  });

  describe('createInvoiceEntry', () => {
    it('should create correct journal entries for invoice', async () => {
      const invoice = {
        _id: 'test-invoice-id',
        number: 'INV-001',
        total: 1150,
        tax: 150,
        subtotal: 1000,
        customerId: 'test-customer',
        tenantId
      };

      const result = await AccountingEngine.createInvoiceEntry(invoice);

      expect(result).toBeDefined();
      
      // Check that AR was debited
      const arEntry = result.lines.find(
        line => line.accountId.toString() === arAccount._id.toString() && line.entryType === 'DEBIT'
      );
      expect(arEntry).toBeDefined();
      expect(arEntry.amount).toBe(1150);

      // Check that Sales was credited
      const salesEntry = result.lines.find(
        line => line.accountId.toString() === salesAccount._id.toString() && line.entryType === 'CREDIT'
      );
      expect(salesEntry).toBeDefined();
      expect(salesEntry.amount).toBe(1000);
    });
  });
});





