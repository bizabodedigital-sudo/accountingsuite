const mongoose = require('mongoose');

/**
 * Audit Log Schema
 * Tracks all user actions and system changes
 */
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      // User actions
      'LOGIN',
      'LOGOUT',
      'LOGIN_FAILED',
      'PASSWORD_CHANGED',
      'PROFILE_UPDATED',
      
      // Invoice actions
      'INVOICE_CREATED',
      'INVOICE_UPDATED',
      'INVOICE_DELETED',
      'INVOICE_SENT',
      'INVOICE_PAID',
      'INVOICE_VOIDED',
      
      // Quote actions
      'QUOTE_CREATED',
      'QUOTE_UPDATED',
      'QUOTE_APPROVED',
      'QUOTE_REJECTED',
      'QUOTE_CONVERTED',
      'QUOTE_DELETED',
      
      // Payment actions
      'PAYMENT_CREATED',
      'PAYMENT_REFUNDED',
      'PAYMENT_CANCELLED',
      
      // Expense actions
      'EXPENSE_CREATED',
      'EXPENSE_UPDATED',
      'EXPENSE_DELETED',
      
      // Customer actions
      'CUSTOMER_CREATED',
      'CUSTOMER_UPDATED',
      'CUSTOMER_DELETED',
      
      // Product actions
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'PRODUCT_DELETED',
      
      // Accounting actions
      'JOURNAL_ENTRY_CREATED',
      'JOURNAL_ENTRY_REVERSED',
      'ACCOUNT_CREATED',
      'ACCOUNT_UPDATED',
      'PERIOD_LOCKED',
      'PERIOD_UNLOCKED',
      
      // Settings actions
      'SETTINGS_UPDATED',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLE_CHANGED',
      
      // System actions
      'BACKUP_CREATED',
      'BACKUP_RESTORED',
      'INTEGRATION_CREATED',
      'INTEGRATION_UPDATED',
      'INTEGRATION_DELETED'
    ],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'USER',
      'INVOICE',
      'QUOTE',
      'PAYMENT',
      'EXPENSE',
      'CUSTOMER',
      'PRODUCT',
      'JOURNAL_ENTRY',
      'ACCOUNT',
      'PERIOD',
      'SETTINGS',
      'BACKUP',
      'INTEGRATION',
      'SYSTEM'
    ],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  entityName: {
    type: String,
    trim: true
  },
  // Changes tracking
  changes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  oldValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    trim: true
  },
  userRole: {
    type: String,
    enum: ['OWNER', 'ACCOUNTANT', 'STAFF', 'READONLY']
  },
  // IP and location
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  // Status
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We use timestamp field instead
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });

// Static method to create audit log
auditLogSchema.statics.log = async function({
  action,
  entityType,
  entityId,
  entityName,
  changes,
  oldValues,
  newValues,
  userId,
  userEmail,
  userRole,
  ipAddress,
  userAgent,
  status,
  errorMessage,
  metadata,
  tenantId
}) {
  try {
    return await this.create({
      action,
      entityType,
      entityId,
      entityName,
      changes,
      oldValues,
      newValues,
      userId,
      userEmail,
      userRole,
      ipAddress,
      userAgent,
      status: status || 'SUCCESS',
      errorMessage,
      metadata,
      tenantId,
      timestamp: new Date()
    });
  } catch (error) {
    // Don't throw error if audit logging fails
    console.error('Audit log error:', error);
    return null;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

