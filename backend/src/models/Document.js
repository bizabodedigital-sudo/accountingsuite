const mongoose = require('mongoose');

/**
 * Document Schema
 * Manages uploaded documents with metadata
 */
const documentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [200, 'Document name cannot exceed 200 characters']
  },
  originalName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  fileKey: {
    type: String,
    required: true,
    unique: true
  },
  fileUrl: {
    type: String
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'INVOICE',
      'RECEIPT',
      'CONTRACT',
      'STATEMENT',
      'TAX',
      'LEGAL',
      'FINANCIAL',
      'GENERAL',
      'OTHER'
    ],
    default: 'GENERAL'
  },
  tags: [{
    type: String,
    trim: true
  }],
  relatedTo: {
    type: {
      type: String,
      enum: ['INVOICE', 'CUSTOMER', 'EXPENSE', 'PRODUCT', 'OTHER'],
      default: 'OTHER'
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['PRIVATE', 'TENANT', 'PUBLIC'],
    default: 'TENANT'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    fileKey: String,
    uploadedAt: Date,
    uploadedBy: mongoose.Schema.Types.ObjectId
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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
documentSchema.index({ tenantId: 1, category: 1 });
documentSchema.index({ tenantId: 1, 'relatedTo.type': 1, 'relatedTo.id': 1 });
documentSchema.index({ tenantId: 1, uploadedBy: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ createdAt: -1 });

// Virtual for file extension
documentSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop()?.toLowerCase() || '';
});

// Virtual for formatted file size
documentSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Pre-save middleware
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find documents by tenant
documentSchema.statics.findByTenant = function(tenantId, filters = {}) {
  return this.find({ tenantId, ...filters }).sort({ createdAt: -1 });
};

// Static method to find documents by category
documentSchema.statics.findByCategory = function(tenantId, category) {
  return this.find({ tenantId, category }).sort({ createdAt: -1 });
};

// Static method to find documents related to an entity
documentSchema.statics.findRelated = function(tenantId, type, id) {
  return this.find({
    tenantId,
    'relatedTo.type': type,
    'relatedTo.id': id
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Document', documentSchema);

