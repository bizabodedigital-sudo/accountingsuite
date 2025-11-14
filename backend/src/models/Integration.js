const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Integration name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Integration type is required'],
    enum: ['n8n', 'zapier', 'make', 'webhook', 'api', 'custom'],
    index: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  credentials: {
    type: Map,
    of: String,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  lastSync: {
    type: Date
  },
  syncStatus: {
    type: String,
    enum: ['success', 'failed', 'pending', 'never'],
    default: 'never'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webhook'
  },
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey'
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
integrationSchema.index({ tenantId: 1, isActive: 1 });
integrationSchema.index({ tenantId: 1, type: 1 });
integrationSchema.index({ type: 1, isConnected: 1 });

// Pre-save middleware to update timestamp
integrationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get connection status
integrationSchema.methods.getStatus = function() {
  if (!this.isActive) return 'inactive';
  if (!this.isConnected) return 'disconnected';
  if (this.syncStatus === 'failed') return 'error';
  if (this.syncStatus === 'pending') return 'syncing';
  return 'connected';
};

module.exports = mongoose.model('Integration', integrationSchema);

