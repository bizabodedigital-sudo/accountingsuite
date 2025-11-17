const JournalEntry = require('../models/JournalEntry');
const LedgerEntry = require('../models/LedgerEntry');
const ChartOfAccount = require('../models/ChartOfAccount');
const FinancialPeriod = require('../models/FinancialPeriod');
const logger = require('../config/logger');

/**
 * Accounting Engine Service
 * Handles all double-entry accounting operations
 */
class AccountingEngine {
  /**
   * Create a journal entry with ledger entries
   * @param {Object} params - Journal entry parameters
   * @param {Date} params.entryDate - Transaction date
   * @param {String} params.description - Description
   * @param {Array} params.entries - Array of {accountId, accountCode, accountName, debit, credit, description}
   * @param {String} params.entryType - Type of entry
   * @param {Object} params.sourceDocument - Reference to source document
   * @param {String} params.reference - Reference number
   * @param {ObjectId} params.tenantId - Tenant ID
   * @param {ObjectId} params.userId - User ID
   * @returns {Promise<Object>} Created journal entry with ledger entries
   */
  static async createJournalEntry({
    entryDate,
    description,
    entries,
    entryType = 'MANUAL',
    sourceDocument = null,
    reference = null,
    tenantId,
    userId
  }) {
    try {
      // Validate entries
      if (!entries || entries.length < 2) {
        throw new Error('Journal entry must have at least 2 entries (debit and credit)');
      }

      // Calculate totals
      const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      // Validate balance
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Journal entry is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
      }

      // Check if period is locked
      const entryDateObj = entryDate ? new Date(entryDate) : new Date();
      const year = entryDateObj.getFullYear();
      const month = entryDateObj.getMonth() + 1;
      
      const period = await FinancialPeriod.findOne({
        tenantId,
        year,
        month
      });

      if (period && period.isLocked) {
        throw new Error(`Cannot post journal entry: Period ${period.periodLabel} is locked`);
      }

      // Validate all accounts exist and belong to tenant
      for (const entry of entries) {
        const account = await ChartOfAccount.findOne({
          _id: entry.accountId,
          tenantId,
          isActive: true
        });

        if (!account) {
          throw new Error(`Account ${entry.accountCode || entry.accountId} not found or inactive`);
        }

        // Set account code and name if not provided
        if (!entry.accountCode) entry.accountCode = account.code;
        if (!entry.accountName) entry.accountName = account.name;
      }

      // Generate entry number
      const entryNumber = await JournalEntry.generateEntryNumber(tenantId);

      // Create journal entry
      const journalEntry = await JournalEntry.create({
        entryNumber,
        entryDate: entryDate || new Date(),
        description,
        reference,
        totalDebits,
        totalCredits,
        isBalanced: true,
        entryType,
        status: 'POSTED', // Auto-post for system entries
        tenantId,
        createdBy: userId,
        postedBy: userId,
        postedAt: new Date()
      });

      // Create ledger entries
      const ledgerEntries = [];
      for (const entry of entries) {
        if (entry.debit > 0) {
          const debitEntry = await LedgerEntry.create({
            journalEntryId: journalEntry._id,
            accountId: entry.accountId,
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            entryType: 'DEBIT',
            amount: entry.debit,
            description: entry.description || description,
            transactionDate: entryDate || new Date(),
            sourceDocument: sourceDocument || {
              type: entryType,
              id: journalEntry._id,
              number: entryNumber
            },
            tenantId,
            createdBy: userId
          });
          ledgerEntries.push(debitEntry);

          // Update account balance
          await ChartOfAccount.findByIdAndUpdate(entry.accountId, {
            $inc: { currentBalance: entry.debit }
          });
        }

        if (entry.credit > 0) {
          const creditEntry = await LedgerEntry.create({
            journalEntryId: journalEntry._id,
            accountId: entry.accountId,
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            entryType: 'CREDIT',
            amount: entry.credit,
            description: entry.description || description,
            transactionDate: entryDate || new Date(),
            sourceDocument: sourceDocument || {
              type: entryType,
              id: journalEntry._id,
              number: entryNumber
            },
            tenantId,
            createdBy: userId
          });
          ledgerEntries.push(creditEntry);

          // Update account balance
          await ChartOfAccount.findByIdAndUpdate(entry.accountId, {
            $inc: { currentBalance: -entry.credit }
          });
        }
      }

      logger.info(`Created journal entry ${entryNumber} with ${ledgerEntries.length} ledger entries`);

      return {
        journalEntry,
        ledgerEntries
      };
    } catch (error) {
      logger.error('Accounting engine error:', error);
      throw error;
    }
  }

  /**
   * Create journal entry from invoice
   * @param {Object} invoice - Invoice document
   * @returns {Promise<Object>} Created journal entry
   */
  static async createInvoiceEntry(invoice) {
    const entries = [];

    // Get accounts
    const arAccountId = await this.getAccountByCode('1030', invoice.tenantId); // Accounts Receivable
    const revenueAccountId = await this.getAccountByCode('6010', invoice.tenantId); // Sales Revenue

    // Debit: Accounts Receivable
    const arAccount = await ChartOfAccount.findById(arAccountId);
    entries.push({
      accountId: arAccountId,
      accountCode: arAccount.code,
      accountName: arAccount.name,
      debit: invoice.total,
      credit: 0,
      description: `Invoice ${invoice.number}`
    });

    // Credit: Revenue
    const revenueAccount = await ChartOfAccount.findById(revenueAccountId);
    entries.push({
      accountId: revenueAccountId,
      accountCode: revenueAccount.code,
      accountName: revenueAccount.name,
      debit: 0,
      credit: invoice.subtotal,
      description: `Invoice ${invoice.number} - Revenue`
    });

    // Credit: GCT Payable (if tax applies)
    if (invoice.taxAmount > 0) {
      const gctAccountId = await this.getAccountByCode('3020', invoice.tenantId); // GCT Payable
      const gctAccount = await ChartOfAccount.findById(gctAccountId);
      entries.push({
        accountId: gctAccountId,
        accountCode: gctAccount.code,
        accountName: gctAccount.name,
        debit: 0,
        credit: invoice.taxAmount,
        description: `Invoice ${invoice.number} - GCT`
      });
    }

    return await this.createJournalEntry({
      entryDate: invoice.issueDate,
      description: `Invoice ${invoice.number}`,
      entries,
      entryType: 'INVOICE',
      sourceDocument: {
        type: 'INVOICE',
        id: invoice._id,
        number: invoice.number
      },
      reference: invoice.number,
      tenantId: invoice.tenantId,
      userId: invoice.createdBy
    });
  }

  /**
   * Create journal entry from expense
   * @param {Object} expense - Expense document
   * @returns {Promise<Object>} Created journal entry
   */
  static async createExpenseEntry(expense) {
    const entries = [];

    // Get expense account based on category
    const expenseAccountId = await this.getExpenseAccountByCategory(expense.category, expense.tenantId);
    const expenseAccount = await ChartOfAccount.findById(expenseAccountId);

    // Debit: Expense Account
    entries.push({
      accountId: expenseAccountId,
      accountCode: expenseAccount.code,
      accountName: expenseAccount.name,
      debit: expense.amount,
      credit: 0,
      description: `Expense - ${expense.description}`
    });

    // Credit: Accounts Payable or Cash
    // For now, assume Accounts Payable (can be changed based on payment method)
    const payableAccountId = await this.getAccountByCode('3010', expense.tenantId); // Accounts Payable
    const payableAccount = await ChartOfAccount.findById(payableAccountId);
    entries.push({
      accountId: payableAccountId,
      accountCode: payableAccount.code,
      accountName: payableAccount.name,
      debit: 0,
      credit: expense.amount,
      description: `Expense - ${expense.description}`
    });

    return await this.createJournalEntry({
      entryDate: expense.date,
      description: `Expense - ${expense.description}`,
      entries,
      entryType: 'EXPENSE',
      sourceDocument: {
        type: 'EXPENSE',
        id: expense._id
      },
      tenantId: expense.tenantId,
      userId: expense.createdBy
    });
  }

  /**
   * Create payment journal entry
   * @param {Object} payment - Payment data
   * @returns {Promise<Object>} Created journal entry
   */
  static async createPaymentEntry(payment) {
    const entries = [];

    // Debit: Cash or Bank Account
    const cashAccountId = await this.getAccountByCode('1010', payment.tenantId); // Cash
    const cashAccount = await ChartOfAccount.findById(cashAccountId);
    entries.push({
      accountId: cashAccountId,
      accountCode: cashAccount.code,
      accountName: cashAccount.name,
      debit: payment.amount,
      credit: 0,
      description: `Payment received - Invoice ${payment.invoiceNumber || ''}`
    });

    // Credit: Accounts Receivable
    const arAccountId = await this.getAccountByCode('1030', payment.tenantId); // Accounts Receivable
    const arAccount = await ChartOfAccount.findById(arAccountId);
    entries.push({
      accountId: arAccountId,
      accountCode: arAccount.code,
      accountName: arAccount.name,
      debit: 0,
      credit: payment.amount,
      description: `Payment received - Invoice ${payment.invoiceNumber || ''}`
    });

    return await this.createJournalEntry({
      entryDate: payment.paymentDate || new Date(),
      description: `Payment - Invoice ${payment.invoiceNumber || ''}`,
      entries,
      entryType: 'PAYMENT',
      sourceDocument: {
        type: 'PAYMENT',
        id: payment._id
      },
      reference: payment.reference,
      tenantId: payment.tenantId,
      userId: payment.createdBy
    });
  }

  /**
   * Get account by code
   * @param {String} code - Account code
   * @param {ObjectId} tenantId - Tenant ID
   * @returns {Promise<ObjectId>} Account ID
   */
  static async getAccountByCode(code, tenantId) {
    const account = await ChartOfAccount.findOne({
      code,
      tenantId,
      isActive: true
    });

    if (!account) {
      throw new Error(`Account with code ${code} not found for tenant`);
    }

    return account._id;
  }

  /**
   * Get expense account by category
   * @param {String} category - Expense category
   * @param {ObjectId} tenantId - Tenant ID
   * @returns {Promise<ObjectId>} Account ID
   */
  static async getExpenseAccountByCategory(category, tenantId) {
    const categoryMap = {
      'RENT': '8010',
      'UTILITIES': '8020',
      'MARKETING': '8040',
      'OFFICE_SUPPLIES': '8050',
      'PROFESSIONAL_SERVICES': '8060',
      'TRAVEL': '8070',
      'OTHER': '8090'
    };

    const code = categoryMap[category] || '8090'; // Default to Other Expenses
    return await this.getAccountByCode(code, tenantId);
  }

  /**
   * Reverse a journal entry
   * @param {ObjectId} journalEntryId - Journal entry to reverse
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Reversal journal entry
   */
  static async reverseJournalEntry(journalEntryId, userId) {
    const originalEntry = await JournalEntry.findById(journalEntryId).populate('ledgerEntries');
    
    if (!originalEntry) {
      throw new Error('Journal entry not found');
    }

    if (originalEntry.isReversal) {
      throw new Error('Cannot reverse a reversal entry');
    }

    const ledgerEntries = await LedgerEntry.find({ journalEntryId: originalEntry._id });
    
    // Create reversed entries (swap debits and credits)
    const reversedEntries = ledgerEntries.map(entry => ({
      accountId: entry.accountId,
      accountCode: entry.accountCode,
      accountName: entry.accountName,
      debit: entry.entryType === 'CREDIT' ? entry.amount : 0,
      credit: entry.entryType === 'DEBIT' ? entry.amount : 0,
      description: `Reversal of ${entry.description}`
    }));

    const reversal = await this.createJournalEntry({
      entryDate: new Date(),
      description: `Reversal of ${originalEntry.description}`,
      entries: reversedEntries,
      entryType: 'REVERSAL',
      reference: `REV-${originalEntry.entryNumber}`,
      tenantId: originalEntry.tenantId,
      userId
    });

    // Link reversal
    originalEntry.reversedBy = reversal.journalEntry._id;
    reversal.journalEntry.isReversal = true;
    reversal.journalEntry.originalEntryId = originalEntry._id;
    await originalEntry.save();
    await reversal.journalEntry.save();

    return reversal;
  }

  /**
   * Get account balance
   * @param {ObjectId} accountId - Account ID
   * @param {Date} asOfDate - Balance as of date (optional)
   * @returns {Promise<Number>} Account balance
   */
  static async getAccountBalance(accountId, asOfDate = null) {
    const account = await ChartOfAccount.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (!asOfDate) {
      return account.currentBalance || 0;
    }

    // Calculate balance up to asOfDate
    const query = {
      accountId,
      transactionDate: { $lte: asOfDate }
    };

    const debits = await LedgerEntry.aggregate([
      { $match: { ...query, entryType: 'DEBIT' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const credits = await LedgerEntry.aggregate([
      { $match: { ...query, entryType: 'CREDIT' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const debitTotal = debits[0]?.total || 0;
    const creditTotal = credits[0]?.total || 0;

    if (account.normalBalance === 'DEBIT') {
      return account.openingBalance + debitTotal - creditTotal;
    } else {
      return account.openingBalance + creditTotal - debitTotal;
    }
  }
}

module.exports = AccountingEngine;

