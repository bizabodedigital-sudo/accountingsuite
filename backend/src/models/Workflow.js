const mongoose = require('mongoose');

/**
 * Workflow Schema
 * Defines automated workflows with triggers and actions
 */
const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
    maxlength: [200, 'Workflow name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  trigger: {
    type: {
      type: String,
      required: true,
      enum: [
        'INVOICE_CREATED',
        'INVOICE_SENT',
        'INVOICE_PAID',
        'INVOICE_OVERDUE',
        'QUOTE_CREATED',
        'QUOTE_APPROVED',
        'QUOTE_REJECTED',
        'PAYMENT_RECEIVED',
        'EXPENSE_CREATED',
        'CUSTOMER_CREATED',
        'PRODUCT_LOW_STOCK',
        'SCHEDULED',
        'MANUAL'
      ]
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Example: { status: 'SENT', amountGreaterThan: 1000 }
    },
    schedule: {
      // For SCHEDULED trigger type
      frequency: {
        type: String,
        enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']
      },
      time: String, // HH:mm format
      dayOfWeek: Number, // 0-6 for weekly
      dayOfMonth: Number, // 1-31 for monthly
      cronExpression: String // For custom schedules
    }
  },
  actions: [{
    type: {
      type: String,
      required: true,
      enum: [
        'SEND_EMAIL',
        'SEND_SMS',
        'CREATE_TASK',
        'UPDATE_STATUS',
        'CREATE_INVOICE',
        'CREATE_EXPENSE',
        'CREATE_PAYMENT',
        'ASSIGN_TO_USER',
        'WEBHOOK',
        'DELAY',
        'CONDITIONAL'
      ]
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: true
      // Example for SEND_EMAIL: { to: 'customer.email', template: 'invoice_reminder', subject: '...' }
      // Example for CREATE_TASK: { title: 'Follow up', assignTo: 'user.id', dueDate: '+7 days' }
      // Example for UPDATE_STATUS: { status: 'APPROVED' }
      // Example for WEBHOOK: { url: 'https://...', method: 'POST', headers: {}, body: {} }
      // Example for DELAY: { duration: 3600 } // seconds
      // Example for CONDITIONAL: { condition: 'amount > 1000', trueActions: [...], falseActions: [...] }
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastRun: {
    type: Date
  },
  runCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
workflowSchema.index({ tenantId: 1, isActive: 1 });
workflowSchema.index({ tenantId: 1, 'trigger.type': 1 });

module.exports = mongoose.model('Workflow', workflowSchema);





