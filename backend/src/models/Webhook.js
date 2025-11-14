const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Webhook name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  url: {
    type: String,
    required: [true, 'Webhook URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS URL'
    }
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  events: {
    type: [String],
    required: [true, 'At least one event is required'],
    enum: [
      'invoice.created',
      'invoice.updated',
      'invoice.sent',
      'invoice.paid',
      'invoice.voided',
      'invoice.deleted',
      'customer.created',
      'customer.updated',
      'customer.deleted',
      'expense.created',
      'expense.updated',
      'expense.deleted',
      'product.created',
      'product.updated',
      'product.deleted',
      'payment.received',
      'payment.refunded'
    ]
  },
  secret: {
    type: String,
    required: [true, 'Webhook secret is required'],
    trim: true,
    minlength: [16, 'Secret must be at least 16 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  platform: {
    type: String,
    enum: ['generic', 'n8n', 'zapier', 'make', 'custom'],
    default: 'generic'
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  retryConfig: {
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    },
    retryDelay: {
      type: Number,
      default: 1000,
      min: 100,
      max: 60000
    }
  },
  lastTriggered: {
    type: Date
  },
  lastSuccess: {
    type: Date
  },
  lastFailure: {
    type: Date
  },
  failureCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
webhookSchema.index({ tenantId: 1, isActive: 1 });
webhookSchema.index({ tenantId: 1, events: 1 });
webhookSchema.index({ platform: 1 });

// Pre-save middleware to update timestamp
webhookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to mask secret for display
webhookSchema.methods.getMaskedSecret = function() {
  if (!this.secret) return '';
  return this.secret.substring(0, 4) + '...' + this.secret.substring(this.secret.length - 4);
};

module.exports = mongoose.model('Webhook', webhookSchema);

