const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'API key name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  key: {
    type: String,
    required: [true, 'API key is required'],
    unique: true,
    index: true
  },
  keyPrefix: {
    type: String,
    required: true,
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
  scopes: {
    type: [String],
    required: [true, 'At least one scope is required'],
    enum: [
      'read:invoices',
      'write:invoices',
      'read:customers',
      'write:customers',
      'read:expenses',
      'write:expenses',
      'read:products',
      'write:products',
      'read:reports',
      'webhooks:manage'
    ],
    default: ['read:invoices', 'read:customers']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60,
      min: 1,
      max: 1000
    }
  },
  ipWhitelist: {
    type: [String],
    default: []
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
apiKeySchema.index({ tenantId: 1, isActive: 1 });
apiKeySchema.index({ keyPrefix: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to update timestamp
apiKeySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to generate API key
apiKeySchema.statics.generateKey = function() {
  const prefix = 'biz_';
  const randomBytes = crypto.randomBytes(32);
  const key = prefix + randomBytes.toString('base64url');
  const keyPrefix = prefix + randomBytes.toString('base64url').substring(0, 8);
  return { key, keyPrefix };
};

// Instance method to mask key for display
apiKeySchema.methods.getMaskedKey = function() {
  if (!this.key) return '';
  return this.keyPrefix + '...' + this.key.substring(this.key.length - 8);
};

// Instance method to check if key is expired
apiKeySchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to check if IP is whitelisted
apiKeySchema.methods.isIpAllowed = function(ip) {
  if (!this.ipWhitelist || this.ipWhitelist.length === 0) return true;
  return this.ipWhitelist.includes(ip);
};

module.exports = mongoose.model('ApiKey', apiKeySchema);

