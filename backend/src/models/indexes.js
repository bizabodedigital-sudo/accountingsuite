/**
 * Database Indexes Configuration
 * 
 * This file ensures all critical indexes are created for optimal query performance.
 * Run this after database connection to create indexes.
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Create all database indexes
 */
async function createIndexes() {
  try {
    // Invoice indexes
    await mongoose.connection.collection('invoices').createIndexes([
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, customerId: 1 } },
      { key: { tenantId: 1, issueDate: -1 } },
      { key: { tenantId: 1, dueDate: 1 } },
      { key: { tenantId: 1, number: 1 }, unique: true }
    ]);

    // Payment indexes
    await mongoose.connection.collection('payments').createIndexes([
      { key: { tenantId: 1, invoiceId: 1 } },
      { key: { tenantId: 1, paymentDate: -1 } },
      { key: { tenantId: 1, status: 1 } }
    ]);

    // Customer indexes
    await mongoose.connection.collection('customers').createIndexes([
      { key: { tenantId: 1, email: 1 } },
      { key: { tenantId: 1, name: 1 } }
    ]);

    // Ledger Entry indexes (critical for reports)
    await mongoose.connection.collection('ledgerentries').createIndexes([
      { key: { tenantId: 1, accountId: 1, transactionDate: -1 } },
      { key: { tenantId: 1, accountId: 1 } },
      { key: { tenantId: 1, transactionDate: -1 } },
      { key: { tenantId: 1, journalEntryId: 1 } }
    ]);

    // Journal Entry indexes
    await mongoose.connection.collection('journalentries').createIndexes([
      { key: { tenantId: 1, transactionDate: -1 } },
      { key: { tenantId: 1, isPosted: 1 } },
      { key: { tenantId: 1, entryNumber: 1 }, unique: true }
    ]);

    // Chart of Account indexes
    await mongoose.connection.collection('chartofaccounts').createIndexes([
      { key: { tenantId: 1, code: 1 }, unique: true },
      { key: { tenantId: 1, type: 1 } },
      { key: { tenantId: 1, isActive: 1 } }
    ]);

    // Product indexes
    await mongoose.connection.collection('products').createIndexes([
      { key: { tenantId: 1, sku: 1 } },
      { key: { tenantId: 1, isActive: 1 } }
    ]);

    // Expense indexes
    await mongoose.connection.collection('expenses').createIndexes([
      { key: { tenantId: 1, expenseDate: -1 } },
      { key: { tenantId: 1, category: 1 } }
    ]);

    // Employee indexes
    await mongoose.connection.collection('employees').createIndexes([
      { key: { tenantId: 1, email: 1 }, unique: true },
      { key: { tenantId: 1, isActive: 1 } }
    ]);

    // Payroll indexes
    await mongoose.connection.collection('payrolls').createIndexes([
      { key: { tenantId: 1, payPeriodStart: -1 } },
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, isPosted: 1 } }
    ]);

    // Quote indexes
    await mongoose.connection.collection('quotes').createIndexes([
      { key: { tenantId: 1, status: 1 } },
      { key: { tenantId: 1, customerId: 1 } },
      { key: { tenantId: 1, issueDate: -1 } }
    ]);

    // Workflow indexes
    await mongoose.connection.collection('workflows').createIndexes([
      { key: { tenantId: 1, isActive: 1 } },
      { key: { tenantId: 1, 'trigger.type': 1 } }
    ]);

    // Financial Period indexes
    await mongoose.connection.collection('financialperiods').createIndexes([
      { key: { tenantId: 1, startDate: 1, endDate: 1 } },
      { key: { tenantId: 1, status: 1 } }
    ]);

    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
    throw error;
  }
}

module.exports = { createIndexes };




