const Tenant = require('../models/Tenant');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get tenant settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tenant: {
          name: tenant.name,
          currency: tenant.currency,
          plan: tenant.plan,
          address: tenant.address,
          phone: tenant.phone,
          email: tenant.email,
          taxId: tenant.taxId
        },
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          phone: req.user.phone
        }
      }
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting settings'
    });
  }
};

// @desc    Update tenant settings
// @route   PUT /api/settings/tenant
// @access  Private
const updateTenantSettings = async (req, res) => {
  try {
    const { name, currency, address, phone, email, taxId } = req.body;
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      {
        ...(name && { name }),
        ...(currency && { currency }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(taxId !== undefined && { taxId })
      },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: tenant.name,
        currency: tenant.currency,
        plan: tenant.plan,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
        taxId: tenant.taxId
      }
    });
  } catch (error) {
    logger.error('Update tenant settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating tenant settings'
    });
  }
};

// @desc    Update user profile settings
// @route   PUT /api/settings/profile
// @access  Private
const updateProfileSettings = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    logger.error('Update profile settings error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error updating profile settings'
    });
  }
};

// @desc    Update preferences
// @route   PUT /api/settings/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { currency, dateFormat, theme, timezone, numberFormat } = req.body;
    
    const updateData = {};
    if (currency) updateData.currency = currency;
    if (dateFormat) updateData.dateFormat = dateFormat;
    if (theme) updateData.theme = theme;
    if (timezone) updateData['settings.timezone'] = timezone;
    if (numberFormat) updateData['settings.numberFormat'] = numberFormat;
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: updateData },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        currency: tenant.currency,
        dateFormat: tenant.dateFormat,
        theme: tenant.theme,
        settings: tenant.settings
      }
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating preferences'
    });
  }
};

// @desc    Update company details
// @route   PUT /api/settings/company-details
// @access  Private
const updateCompanyDetails = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Update main tenant fields
    if (req.body.name) tenant.name = req.body.name;
    if (req.body.email) tenant.email = req.body.email;
    if (req.body.phone) tenant.phone = req.body.phone;
    if (req.body.address) tenant.address = req.body.address;
    if (req.body.currency) tenant.currency = req.body.currency;
    if (req.body.taxId) tenant.taxId = req.body.taxId;

    // Update company details in settings
    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.companyDetails) tenant.settings.companyDetails = {};
    
    Object.keys(req.body).forEach(key => {
      if (['legalName', 'idNumber', 'gctNumber', 'industry', 'fiscalYearStart',
           'street1', 'street2', 'city', 'parish', 'country', 'website', 'logo',
           'defaultInvoiceTerms', 'defaultPaymentTerms', 'defaultTaxRate', 'defaultDocumentFooter'].includes(key)) {
        tenant.settings.companyDetails[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.companyDetails
    });
  } catch (error) {
    logger.error('Update company details error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating company details'
    });
  }
};

// @desc    Update tax settings
// @route   PUT /api/settings/tax
// @access  Private
const updateTaxSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.taxSettings) tenant.settings.taxSettings = {};

    if (req.body.registeredForGCT !== undefined) {
      tenant.settings.taxSettings.registeredForGCT = req.body.registeredForGCT;
    }
    if (req.body.gctRegistrationNo) {
      tenant.settings.taxSettings.gctRegistrationNo = req.body.gctRegistrationNo;
    }
    if (req.body.defaultTaxRateOnProducts !== undefined) {
      tenant.settings.taxSettings.defaultTaxRateOnProducts = req.body.defaultTaxRateOnProducts;
    }
    if (req.body.shippingTaxBehavior) {
      tenant.settings.taxSettings.shippingTaxBehavior = req.body.shippingTaxBehavior;
    }
    if (req.body.taxTypes) {
      tenant.settings.taxSettings.taxTypes = req.body.taxTypes;
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.taxSettings
    });
  } catch (error) {
    logger.error('Update tax settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating tax settings'
    });
  }
};

// @desc    Update payment settings
// @route   PUT /api/settings/payments
// @access  Private
const updatePaymentSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.paymentSettings) tenant.settings.paymentSettings = {};

    if (req.body.defaultPaymentMethods) {
      tenant.settings.paymentSettings.defaultPaymentMethods = req.body.defaultPaymentMethods;
    }
    if (req.body.paymentTerms) {
      tenant.settings.paymentSettings.paymentTerms = req.body.paymentTerms;
    }
    if (req.body.gateways) {
      tenant.settings.paymentSettings.gateways = req.body.gateways;
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.paymentSettings
    });
  } catch (error) {
    logger.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating payment settings'
    });
  }
};

// @desc    Update localization settings
// @route   PUT /api/settings/localization
// @access  Private
const updateLocalizationSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};

    if (req.body.timezone) tenant.settings.timezone = req.body.timezone;
    if (req.body.numberFormat) tenant.settings.numberFormat = req.body.numberFormat;
    if (req.body.fiscalYearStartMonth !== undefined) {
      tenant.settings.fiscalYearStartMonth = req.body.fiscalYearStartMonth;
    }
    if (req.body.weekStart) tenant.settings.weekStart = req.body.weekStart;
    if (req.body.defaultLanguage) tenant.settings.defaultLanguage = req.body.defaultLanguage;
    if (req.body.dateFormat) tenant.dateFormat = req.body.dateFormat;

    await tenant.save();

    res.status(200).json({
      success: true,
      data: {
        timezone: tenant.settings.timezone,
        numberFormat: tenant.settings.numberFormat,
        fiscalYearStartMonth: tenant.settings.fiscalYearStartMonth,
        weekStart: tenant.settings.weekStart,
        defaultLanguage: tenant.settings.defaultLanguage,
        dateFormat: tenant.dateFormat
      }
    });
  } catch (error) {
    logger.error('Update localization settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating localization settings'
    });
  }
};

// @desc    Update product settings
// @route   PUT /api/settings/products
// @access  Private
const updateProductSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.productSettings) tenant.settings.productSettings = {};

    Object.keys(req.body).forEach(key => {
      if (['defaultIncomeAccount', 'defaultTaxRateOnProducts', 'skuGenerationRule', 'inventoryTracking'].includes(key)) {
        tenant.settings.productSettings[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.productSettings
    });
  } catch (error) {
    logger.error('Update product settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating product settings'
    });
  }
};

// @desc    Update task settings
// @route   PUT /api/settings/tasks
// @access  Private
const updateTaskSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.taskSettings) tenant.settings.taskSettings = {};

    Object.keys(req.body).forEach(key => {
      if (['defaultTaskRate', 'defaultProject', 'timesheetRounding'].includes(key)) {
        tenant.settings.taskSettings[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.taskSettings
    });
  } catch (error) {
    logger.error('Update task settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating task settings'
    });
  }
};

// @desc    Update expense settings
// @route   PUT /api/settings/expenses
// @access  Private
const updateExpenseSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.expenseSettings) tenant.settings.expenseSettings = {};

    Object.keys(req.body).forEach(key => {
      if (['defaultExpenseAccount', 'defaultTaxTreatment', 'receiptAttachmentRequired', 'categories'].includes(key)) {
        tenant.settings.expenseSettings[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.expenseSettings
    });
  } catch (error) {
    logger.error('Update expense settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating expense settings'
    });
  }
};

// @desc    Update workflow settings
// @route   PUT /api/settings/workflows
// @access  Private
const updateWorkflowSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.workflowSettings) tenant.settings.workflowSettings = {};

    Object.keys(req.body).forEach(key => {
      if (['requireApprovalForInvoicesOver', 'approverRoles', 'autoSendReminderDaysBeforeDue', 'autoMarkAsPaidOnBankMatch'].includes(key)) {
        tenant.settings.workflowSettings[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.workflowSettings
    });
  } catch (error) {
    logger.error('Update workflow settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating workflow settings'
    });
  }
};

// @desc    Update numbering settings
// @route   PUT /api/settings/numbering
// @access  Private
const updateNumberingSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};

    if (req.body.invoicePrefix) tenant.settings.invoicePrefix = req.body.invoicePrefix;
    if (req.body.invoicePadding !== undefined) {
      // Store padding info (not directly in model, but can be used)
    }
    if (req.body.quotePrefix) tenant.settings.quotePrefix = req.body.quotePrefix;
    if (req.body.poPrefix) tenant.settings.poPrefix = req.body.poPrefix;
    if (req.body.creditNotePrefix) tenant.settings.creditNotePrefix = req.body.creditNotePrefix;
    if (req.body.separateCountersPerYear !== undefined) {
      tenant.settings.separateCountersPerYear = req.body.separateCountersPerYear;
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      data: {
        invoicePrefix: tenant.settings.invoicePrefix,
        quotePrefix: tenant.settings.quotePrefix,
        poPrefix: tenant.settings.poPrefix,
        creditNotePrefix: tenant.settings.creditNotePrefix,
        separateCountersPerYear: tenant.settings.separateCountersPerYear
      }
    });
  } catch (error) {
    logger.error('Update numbering settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating numbering settings'
    });
  }
};

// @desc    Update email settings
// @route   PUT /api/settings/email
// @access  Private
const updateEmailSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.emailSettings) tenant.settings.emailSettings = {};

    Object.keys(req.body).forEach(key => {
      if (['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'fromName', 'fromEmail', 'replyTo'].includes(key)) {
        tenant.settings.emailSettings[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.emailSettings
    });
  } catch (error) {
    logger.error('Update email settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating email settings'
    });
  }
};

// @desc    Update client portal settings
// @route   PUT /api/settings/client-portal
// @access  Private
const updateClientPortalSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.clientPortal) tenant.settings.clientPortal = {};

    Object.keys(req.body).forEach(key => {
      if (['enabled', 'portalUrl', 'allowViewInvoices', 'allowViewQuotes', 
           'allowViewPaymentHistory', 'allowViewDocuments', 'allowCardPayments', 'loginMethod'].includes(key)) {
        tenant.settings.clientPortal[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.clientPortal
    });
  } catch (error) {
    logger.error('Update client portal settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating client portal settings'
    });
  }
};

// @desc    Update advanced settings
// @route   PUT /api/settings/advanced
// @access  Private
const updateAdvancedSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.advancedSettings) tenant.settings.advancedSettings = {};

    Object.keys(req.body).forEach(key => {
      if (['apiKey', 'webhookUrl', 'enableInventory', 'enableMultiCurrency', 
           'enableProjects', 'passwordPolicy', 'sessionTimeout'].includes(key)) {
        tenant.settings.advancedSettings[key] = req.body[key];
      }
    });

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant.settings.advancedSettings
    });
  } catch (error) {
    logger.error('Update advanced settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating advanced settings'
    });
  }
};

// @desc    Get all settings
// @route   GET /api/settings/all
// @access  Private
const getAllSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tenant: {
          name: tenant.name,
          currency: tenant.currency,
          plan: tenant.plan,
          address: tenant.address,
          phone: tenant.phone,
          email: tenant.email,
          taxId: tenant.taxId,
          dateFormat: tenant.dateFormat,
          theme: tenant.theme
        },
        settings: tenant.settings || {}
      }
    });
  } catch (error) {
    logger.error('Get all settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting all settings'
    });
  }
};

module.exports = {
  getSettings,
  getAllSettings,
  updateTenantSettings,
  updateProfileSettings,
  updatePreferences,
  updateCompanyDetails,
  updateTaxSettings,
  updatePaymentSettings,
  updateLocalizationSettings,
  updateProductSettings,
  updateTaskSettings,
  updateExpenseSettings,
  updateWorkflowSettings,
  updateNumberingSettings,
  updateEmailSettings,
  updateClientPortalSettings,
  updateAdvancedSettings
};

