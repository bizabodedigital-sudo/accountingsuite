const mongoose = require('mongoose');

/**
 * Permission Schema
 * Defines granular permissions for different roles
 */
const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'INVOICES',
      'CUSTOMERS',
      'PRODUCTS',
      'EXPENSES',
      'REPORTS',
      'SETTINGS',
      'USERS',
      'BACKUP',
      'DOCUMENTS',
      'INVENTORY'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Predefined permissions
const DEFAULT_PERMISSIONS = [
  // Invoices
  { name: 'INVOICES_VIEW', description: 'View invoices', category: 'INVOICES' },
  { name: 'INVOICES_CREATE', description: 'Create invoices', category: 'INVOICES' },
  { name: 'INVOICES_EDIT', description: 'Edit invoices', category: 'INVOICES' },
  { name: 'INVOICES_DELETE', description: 'Delete invoices', category: 'INVOICES' },
  { name: 'INVOICES_SEND', description: 'Send invoices', category: 'INVOICES' },
  { name: 'INVOICES_VOID', description: 'Void invoices', category: 'INVOICES' },
  
  // Customers
  { name: 'CUSTOMERS_VIEW', description: 'View customers', category: 'CUSTOMERS' },
  { name: 'CUSTOMERS_CREATE', description: 'Create customers', category: 'CUSTOMERS' },
  { name: 'CUSTOMERS_EDIT', description: 'Edit customers', category: 'CUSTOMERS' },
  { name: 'CUSTOMERS_DELETE', description: 'Delete customers', category: 'CUSTOMERS' },
  
  // Products
  { name: 'PRODUCTS_VIEW', description: 'View products', category: 'PRODUCTS' },
  { name: 'PRODUCTS_CREATE', description: 'Create products', category: 'PRODUCTS' },
  { name: 'PRODUCTS_EDIT', description: 'Edit products', category: 'PRODUCTS' },
  { name: 'PRODUCTS_DELETE', description: 'Delete products', category: 'PRODUCTS' },
  
  // Expenses
  { name: 'EXPENSES_VIEW', description: 'View expenses', category: 'EXPENSES' },
  { name: 'EXPENSES_CREATE', description: 'Create expenses', category: 'EXPENSES' },
  { name: 'EXPENSES_EDIT', description: 'Edit expenses', category: 'EXPENSES' },
  { name: 'EXPENSES_DELETE', description: 'Delete expenses', category: 'EXPENSES' },
  
  // Reports
  { name: 'REPORTS_VIEW', description: 'View reports', category: 'REPORTS' },
  { name: 'REPORTS_EXPORT', description: 'Export reports', category: 'REPORTS' },
  
  // Settings
  { name: 'SETTINGS_VIEW', description: 'View settings', category: 'SETTINGS' },
  { name: 'SETTINGS_EDIT', description: 'Edit settings', category: 'SETTINGS' },
  
  // Users
  { name: 'USERS_VIEW', description: 'View users', category: 'USERS' },
  { name: 'USERS_CREATE', description: 'Create users', category: 'USERS' },
  { name: 'USERS_EDIT', description: 'Edit users', category: 'USERS' },
  { name: 'USERS_DELETE', description: 'Delete users', category: 'USERS' },
  
  // Backup
  { name: 'BACKUP_CREATE', description: 'Create backups', category: 'BACKUP' },
  { name: 'BACKUP_RESTORE', description: 'Restore backups', category: 'BACKUP' },
  { name: 'BACKUP_VIEW', description: 'View backups', category: 'BACKUP' },
  
  // Documents
  { name: 'DOCUMENTS_VIEW', description: 'View documents', category: 'DOCUMENTS' },
  { name: 'DOCUMENTS_UPLOAD', description: 'Upload documents', category: 'DOCUMENTS' },
  { name: 'DOCUMENTS_DELETE', description: 'Delete documents', category: 'DOCUMENTS' },
  
  // Inventory
  { name: 'INVENTORY_VIEW', description: 'View inventory', category: 'INVENTORY' },
  { name: 'INVENTORY_EDIT', description: 'Edit inventory', category: 'INVENTORY' },
  { name: 'INVENTORY_ADJUST', description: 'Adjust inventory', category: 'INVENTORY' }
];

// Role-based permission mappings
const ROLE_PERMISSIONS = {
  OWNER: DEFAULT_PERMISSIONS.map(p => p.name), // All permissions
  ACCOUNTANT: [
    'INVOICES_VIEW', 'INVOICES_CREATE', 'INVOICES_EDIT', 'INVOICES_SEND',
    'CUSTOMERS_VIEW', 'CUSTOMERS_CREATE', 'CUSTOMERS_EDIT',
    'PRODUCTS_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_EDIT',
    'EXPENSES_VIEW', 'EXPENSES_CREATE', 'EXPENSES_EDIT',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
    'SETTINGS_VIEW',
    'DOCUMENTS_VIEW', 'DOCUMENTS_UPLOAD',
    'INVENTORY_VIEW', 'INVENTORY_EDIT', 'INVENTORY_ADJUST'
  ],
  STAFF: [
    'INVOICES_VIEW', 'INVOICES_CREATE',
    'CUSTOMERS_VIEW', 'CUSTOMERS_CREATE',
    'PRODUCTS_VIEW',
    'EXPENSES_VIEW', 'EXPENSES_CREATE',
    'DOCUMENTS_VIEW', 'DOCUMENTS_UPLOAD',
    'INVENTORY_VIEW'
  ],
  READONLY: [
    'INVOICES_VIEW',
    'CUSTOMERS_VIEW',
    'PRODUCTS_VIEW',
    'EXPENSES_VIEW',
    'REPORTS_VIEW',
    'DOCUMENTS_VIEW',
    'INVENTORY_VIEW'
  ]
};

// Static method to get permissions for a role
permissionSchema.statics.getRolePermissions = function(role) {
  return ROLE_PERMISSIONS[role.toUpperCase()] || [];
};

// Static method to check if role has permission
permissionSchema.statics.hasPermission = function(role, permission) {
  const permissions = this.getRolePermissions(role);
  return permissions.includes(permission.toUpperCase());
};

// Static method to initialize default permissions
permissionSchema.statics.initializePermissions = async function() {
  try {
    for (const perm of DEFAULT_PERMISSIONS) {
      await this.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
    }
    return { success: true, message: 'Permissions initialized' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  Permission: mongoose.model('Permission', permissionSchema),
  ROLE_PERMISSIONS,
  DEFAULT_PERMISSIONS
};

