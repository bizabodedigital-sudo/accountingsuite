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
    enum: [
      'JMD', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 
      'INR', 'BRL', 'MXN', 'ZAR', 'SGD', 'HKD', 'NZD', 'KRW', 'TRY'
    ],
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
    // Localization
    timezone: {
      type: String,
      default: 'America/Jamaica'
    },
    numberFormat: {
      type: String,
      default: '1,000.00',
      enum: ['1,000.00', '1.000,00', '1 000.00']
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 1,
      min: 1,
      max: 12
    },
    weekStart: {
      type: String,
      default: 'Sunday',
      enum: ['Sunday', 'Monday']
    },
    defaultLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'es']
    },
    // Tax Settings
    taxSettings: {
      registeredForGCT: {
        type: Boolean,
        default: false
      },
      gctRegistrationNo: String,
      defaultTaxRateOnProducts: {
        type: Number,
        default: 15,
        min: 0,
        max: 100
      },
      shippingTaxBehavior: {
        type: String,
        default: 'standard',
        enum: ['standard', 'zero', 'exempt']
      },
      taxTypes: [{
        name: String,
        rate: {
          type: Number,
          min: 0,
          max: 100
        },
        inclusive: {
          type: Boolean,
          default: false
        },
        isDefault: {
          type: Boolean,
          default: false
        }
      }]
    },
    // Payment Settings
    paymentSettings: {
      defaultPaymentMethods: [{
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'Mobile Wallet']
      }],
      paymentTerms: [{
        name: String,
        days: {
          type: Number,
          default: 0
        }
      }],
      gateways: [{
        name: String,
        type: {
          type: String,
          enum: ['Stripe', 'WiPay', 'Lynk', 'PayPal', 'Other']
        },
        apiKey: String,
        apiSecret: String,
        callbackUrl: String,
        isActive: {
          type: Boolean,
          default: false
        }
      }]
    },
    // Product Settings
    productSettings: {
      defaultIncomeAccount: String,
      defaultTaxRateOnProducts: {
        type: Number,
        default: 15
      },
      skuGenerationRule: {
        type: String,
        default: 'auto',
        enum: ['auto', 'manual']
      },
      inventoryTracking: {
        type: Boolean,
        default: false
      }
    },
    // Task Settings
    taskSettings: {
      defaultTaskRate: {
        type: Number,
        default: 0
      },
      defaultProject: String,
      timesheetRounding: {
        type: String,
        default: 'none',
        enum: ['none', '15min', '30min', '1hour']
      }
    },
    // Expense Settings
    expenseSettings: {
      defaultExpenseAccount: {
        type: String,
        default: 'General Expenses'
      },
      defaultTaxTreatment: {
        type: String,
        default: 'claimable',
        enum: ['claimable', 'non-claimable']
      },
      receiptAttachmentRequired: {
        type: Boolean,
        default: true
      },
      categories: [String]
    },
    // Workflow Settings
    workflowSettings: {
      requireApprovalForInvoicesOver: {
        type: Number,
        default: 0
      },
      approverRoles: [{
        type: String,
        enum: ['OWNER', 'ACCOUNTANT', 'STAFF']
      }],
      autoSendReminderDaysBeforeDue: {
        type: Number,
        default: 3
      },
      autoMarkAsPaidOnBankMatch: {
        type: Boolean,
        default: false
      }
    },
    // Invoice Numbering
    invoicePrefix: {
      type: String,
      default: 'INV'
    },
    invoiceNumber: {
      type: Number,
      default: 1
    },
    quotePrefix: {
      type: String,
      default: 'QUO'
    },
    quoteNumber: {
      type: Number,
      default: 1
    },
    poPrefix: {
      type: String,
      default: 'PO'
    },
    poNumber: {
      type: Number,
      default: 1
    },
    creditNotePrefix: {
      type: String,
      default: 'CN'
    },
    creditNoteNumber: {
      type: Number,
      default: 1
    },
    separateCountersPerYear: {
      type: Boolean,
      default: false
    },
    // Company Details
    companyDetails: {
      legalName: String,
      idNumber: String,
      gctNumber: String,
      industry: String,
      fiscalYearStart: String,
      street1: String,
      street2: String,
      city: String,
      parish: String,
      country: {
        type: String,
        default: 'Jamaica'
      },
      website: String,
      logo: String,
      defaultInvoiceTerms: String,
      defaultPaymentTerms: {
        type: String,
        default: 'Net 30'
      },
      defaultTaxRate: {
        type: Number,
        default: 15
      },
      defaultDocumentFooter: String
    },
    // Email Settings
    emailSettings: {
      smtpHost: String,
      smtpPort: {
        type: Number,
        default: 587
      },
      smtpUser: String,
      smtpPass: String,
      fromName: String,
      fromEmail: String,
      replyTo: String
    },
    // Client Portal
    clientPortal: {
      enabled: {
        type: Boolean,
        default: false
      },
      portalUrl: String,
      allowViewInvoices: {
        type: Boolean,
        default: true
      },
      allowViewQuotes: {
        type: Boolean,
        default: true
      },
      allowViewPaymentHistory: {
        type: Boolean,
        default: true
      },
      allowViewDocuments: {
        type: Boolean,
        default: false
      },
      allowCardPayments: {
        type: Boolean,
        default: false
      },
      loginMethod: {
        type: String,
        default: 'email',
        enum: ['email', 'password']
      }
    },
    // Advanced Settings
    advancedSettings: {
      apiKey: String,
      webhookUrl: String,
      enableInventory: {
        type: Boolean,
        default: true
      },
      enableMultiCurrency: {
        type: Boolean,
        default: true
      },
      enableProjects: {
        type: Boolean,
        default: false
      },
      passwordPolicy: {
        type: String,
        default: 'standard',
        enum: ['standard', 'strong', 'very-strong']
      },
      sessionTimeout: {
        type: Number,
        default: 60
      }
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











