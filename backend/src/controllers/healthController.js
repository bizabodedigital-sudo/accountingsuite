const ChartOfAccount = require('../models/ChartOfAccount');
const JournalEntry = require('../models/JournalEntry');
const LedgerEntry = require('../models/LedgerEntry');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
const healthCheck = async (req, res) => {
  try {
    const checks = {
      database: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      checks.database = true;
    }

    // Check Redis (if available)
    try {
      const redis = require('../config/redis');
      if (redis && redis.isOpen) {
        checks.redis = true;
      }
    } catch (error) {
      // Redis not critical
    }

    const isHealthy = checks.database;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
};

/**
 * @desc    Financial health check
 * @route   GET /api/health/financial
 * @access  Private
 */
const financialHealthCheck = async (req, res) => {
  try {
    const query = req.tenantQuery();
    const issues = [];
    const warnings = [];

    // 1. Check for unbalanced journal entries
    const unbalancedEntries = await JournalEntry.find({
      ...query,
      isPosted: true
    }).populate('lines.accountId');

    for (const entry of unbalancedEntries) {
      const debits = entry.lines
        .filter(line => line.entryType === 'DEBIT')
        .reduce((sum, line) => sum + line.amount, 0);
      const credits = entry.lines
        .filter(line => line.entryType === 'CREDIT')
        .reduce((sum, line) => sum + line.amount, 0);

      if (Math.abs(debits - credits) > 0.01) {
        issues.push({
          type: 'UNBALANCED_ENTRY',
          severity: 'ERROR',
          message: `Journal entry ${entry.entryNumber} is unbalanced (Debits: ${debits}, Credits: ${credits})`,
          entryId: entry._id
        });
      }
    }

    // 2. Check for orphaned ledger entries (no journal entry)
    const ledgerEntries = await LedgerEntry.find(query);
    const journalEntryIds = new Set(
      (await JournalEntry.find(query).select('_id')).map(j => j._id.toString())
    );

    const orphanedLedgerEntries = ledgerEntries.filter(
      le => !journalEntryIds.has(le.journalEntryId?.toString())
    );

    if (orphanedLedgerEntries.length > 0) {
      warnings.push({
        type: 'ORPHANED_LEDGER_ENTRIES',
        severity: 'WARNING',
        message: `Found ${orphanedLedgerEntries.length} orphaned ledger entries`,
        count: orphanedLedgerEntries.length
      });
    }

    // 3. Check for duplicate customers (same email)
    const customers = await Customer.find(query);
    const emailMap = new Map();
    customers.forEach(customer => {
      if (customer.email) {
        const key = customer.email.toLowerCase();
        if (!emailMap.has(key)) {
          emailMap.set(key, []);
        }
        emailMap.get(key).push(customer);
      }
    });

    const duplicateCustomers = Array.from(emailMap.values())
      .filter(customers => customers.length > 1);

    if (duplicateCustomers.length > 0) {
      warnings.push({
        type: 'DUPLICATE_CUSTOMERS',
        severity: 'WARNING',
        message: `Found ${duplicateCustomers.length} duplicate customer emails`,
        duplicates: duplicateCustomers.map(c => ({
          email: c[0].email,
          count: c.length,
          customerIds: c.map(cust => cust._id)
        }))
      });
    }

    // 4. Check for invoices without ledger entries (if status is SENT or PAID)
    const invoicesNeedingEntries = await Invoice.find({
      ...query,
      status: { $in: ['SENT', 'PAID'] }
    });

    for (const invoice of invoicesNeedingEntries) {
      const hasLedgerEntry = await LedgerEntry.findOne({
        ...query,
        reference: invoice.number
      });

      if (!hasLedgerEntry) {
        warnings.push({
          type: 'INVOICE_WITHOUT_LEDGER_ENTRY',
          severity: 'WARNING',
          message: `Invoice ${invoice.number} (${invoice.status}) has no ledger entry`,
          invoiceId: invoice._id,
          invoiceNumber: invoice.number
        });
      }
    }

    // 5. Check for payments without ledger entries
    const payments = await Payment.find(query);
    for (const payment of payments) {
      const hasLedgerEntry = await LedgerEntry.findOne({
        ...query,
        reference: payment.paymentNumber || payment._id.toString()
      });

      if (!hasLedgerEntry && payment.status !== 'CANCELLED') {
        warnings.push({
          type: 'PAYMENT_WITHOUT_LEDGER_ENTRY',
          severity: 'WARNING',
          message: `Payment ${payment.paymentNumber || payment._id} has no ledger entry`,
          paymentId: payment._id
        });
      }
    }

    // 6. Check Trial Balance (sum of all ledger entries should balance)
    const accounts = await ChartOfAccount.find({
      ...query,
      isActive: true
    });

    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      const entries = await LedgerEntry.find({
        ...query,
        accountId: account._id
      });

      entries.forEach(entry => {
        if (entry.entryType === 'DEBIT') {
          totalDebits += entry.amount;
        } else {
          totalCredits += entry.amount;
        }
      });
    }

    const balanceDifference = Math.abs(totalDebits - totalCredits);
    if (balanceDifference > 0.01) {
      issues.push({
        type: 'TRIAL_BALANCE_IMBALANCE',
        severity: 'ERROR',
        message: `Trial balance is unbalanced. Difference: ${balanceDifference.toFixed(2)}`,
        totalDebits,
        totalCredits,
        difference: balanceDifference
      });
    }

    // 7. Check for accounts without opening balances (if period has started)
    const accountsWithoutOpening = accounts.filter(async (account) => {
      const hasOpeningBalance = await LedgerEntry.findOne({
        ...query,
        accountId: account._id,
        isOpeningBalance: true
      });
      return !hasOpeningBalance && account.type !== 'INCOME' && account.type !== 'EXPENSE';
    });

    if (accountsWithoutOpening.length > 0) {
      warnings.push({
        type: 'MISSING_OPENING_BALANCES',
        severity: 'INFO',
        message: `${accountsWithoutOpening.length} accounts may need opening balances`,
        accountCount: accountsWithoutOpening.length
      });
    }

    const isHealthy = issues.length === 0;

    res.status(isHealthy ? 200 : 400).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'issues_found',
      summary: {
        totalIssues: issues.length,
        totalWarnings: warnings.length,
        issues,
        warnings
      },
      trialBalance: {
        totalDebits,
        totalCredits,
        difference: balanceDifference,
        isBalanced: balanceDifference <= 0.01
      }
    });
  } catch (error) {
    logger.error('Financial health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  healthCheck,
  financialHealthCheck
};





