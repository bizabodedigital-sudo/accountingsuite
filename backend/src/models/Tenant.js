const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Tenant name cannot exceed 100 characters']
  },
  currency: {
    type: String,
    default: 'JMD',
    enum: ['JMD', 'USD', 'EUR', 'GBP'],
    uppercase: true
  },
  plan: {
    type: String,
    default: 'STARTER',
    enum: ['STARTER', 'PRO', 'PREMIUM', 'ENTERPRISE'],
    uppercase: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  taxId: {
    type: String,
    trim: true
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY',
    enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark', 'auto']
  },
  settings: {
    timezone: {
      type: String,
      default: 'America/Jamaica'
    },
    invoicePrefix: {
      type: String,
      default: 'INV'
    },
    invoiceNumber: {
      type: Number,
      default: 1
    }
  },
  isActive: {
    type: Boolean,
    default: true
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
tenantSchema.index({ name: 1 });
tenantSchema.index({ isActive: 1 });

// Virtual for user count
tenantSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'tenantId',
  count: true
});

// Pre-save middleware
tenantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);











