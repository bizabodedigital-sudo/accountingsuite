# New Features Added to Biz Accounts

This document outlines all the new features that have been added to the application.

## 1. Jamaican Tax Calculation (GCT)

### Features
- **GCT Calculation Service** (`backend/src/services/taxService.js`)
  - Calculates General Consumption Tax (GCT) at 15% standard rate
  - Supports multiple tax types: STANDARD, ZERO, EXEMPT, CUSTOM
  - Multi-item tax calculation
  - GCT registration threshold checking (JMD 3,000,000 annual turnover)
  - TRN (Tax Registration Number) validation and formatting

### API Endpoints
- `POST /api/tax/calculate` - Calculate tax for a single amount
- `POST /api/tax/calculate-multi` - Calculate tax for multiple items
- `POST /api/tax/check-registration` - Check if business needs GCT registration
- `POST /api/tax/validate-trn` - Validate Jamaican TRN format

### Integration
- Invoice creation automatically uses tax service when `taxType` is provided
- Invoice model now includes `taxType` and `customTaxRate` fields

## 2. Enhanced User Roles & Permissions

### Features
- **Permission System** (`backend/src/models/Permission.js`)
  - Granular permission-based access control
  - Predefined permissions for all major features
  - Role-based permission mappings:
    - **OWNER**: Full access to all features
    - **ACCOUNTANT**: Access to financial operations, reports, settings
    - **STAFF**: Limited access to create/view invoices, customers, expenses
    - **READONLY**: View-only access

### Permission Categories
- Invoices (VIEW, CREATE, EDIT, DELETE, SEND, VOID)
- Customers (VIEW, CREATE, EDIT, DELETE)
- Products (VIEW, CREATE, EDIT, DELETE)
- Expenses (VIEW, CREATE, EDIT, DELETE)
- Reports (VIEW, EXPORT)
- Settings (VIEW, EDIT)
- Users (VIEW, CREATE, EDIT, DELETE)
- Backup (CREATE, RESTORE, VIEW)
- Documents (VIEW, UPLOAD, DELETE)
- Inventory (VIEW, EDIT, ADJUST)

### Middleware
- `hasPermission(permission)` - Check if user has specific permission
- Enhanced `authorize()` middleware for role-based access

## 3. Auto Backup and Recovery

### Features
- **Backup Service** (`backend/src/services/backupService.js`)
  - Full database backup (all tenants)
  - Tenant-specific backup
  - Automatic backup scheduling support
  - Backup cleanup (keep last N backups)
  - S3 integration for cloud backup storage

### API Endpoints
- `POST /api/backup` - Create backup (OWNER, ACCOUNTANT)
- `GET /api/backup` - List available backups
- `POST /api/backup/restore/:backupName` - Restore from backup (OWNER only)
- `DELETE /api/backup/:backupName` - Delete backup (OWNER only)
- `POST /api/backup/cleanup` - Cleanup old backups (OWNER only)

### Backup Format
- JSON format with all collections
- Includes metadata (timestamp, tenant ID, version)
- Supports selective restore by tenant

## 4. Enhanced Email Options

### Features
- **Enhanced Email Service** (`backend/src/services/emailService.js`)
  - Password reset emails
  - Invoice reminder emails (with overdue notifications)
  - Custom email sending
  - Professional HTML email templates
  - Attachment support

### New Email Methods
- `sendPasswordResetEmail()` - Send password reset link
- `sendInvoiceReminderEmail()` - Send payment reminders
- `sendCustomEmail()` - Send custom emails with attachments

### Email Templates
- Welcome email (existing)
- Invoice email (existing)
- Password reset email (new)
- Invoice reminder email (new)

## 5. Multi-Currency Support

### Features
- **Currency Model** (`backend/src/models/Currency.js`)
  - Support for 18+ currencies
  - Exchange rate management
  - Base currency (JMD) support
  - Currency conversion
  - Automatic formatting

### Supported Currencies
JMD, USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, BRL, MXN, ZAR, SGD, HKD, NZD, KRW, TRY

### API Endpoints
- `GET /api/currencies` - Get all active currencies
- `GET /api/currencies/:code` - Get specific currency
- `POST /api/currencies/convert` - Convert between currencies
- `PUT /api/currencies/rates` - Update exchange rates (OWNER, ACCOUNTANT)
- `POST /api/currencies/initialize` - Initialize default currencies (OWNER)

### Features
- Real-time currency conversion
- Exchange rate history tracking
- Base currency (JMD) with rate of 1
- Automatic currency formatting

## 6. Document Upload and Management

### Features
- **Document Model** (`backend/src/models/Document.js`)
  - Full document lifecycle management
  - Document categorization
  - Tagging system
  - Related entity linking (invoices, customers, expenses, products)
  - Version control support
  - Access level control (PRIVATE, TENANT, PUBLIC)

### Document Categories
INVOICE, RECEIPT, CONTRACT, STATEMENT, TAX, LEGAL, FINANCIAL, GENERAL, OTHER

### API Endpoints
- `POST /api/documents` - Upload document
- `GET /api/documents` - List documents (with filters)
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Get download URL

### Features
- File upload to S3 storage
- Document metadata management
- Search by category, tags, related entities
- Presigned URL for secure downloads
- File size and type tracking

## 7. Enhanced Inventory Management

### Features
- **Inventory Movement Model** (`backend/src/models/InventoryMovement.js`)
  - Complete stock movement tracking
  - Multiple movement types (PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGED, TRANSFER, CORRECTION)
  - Stock history tracking
  - Cost tracking per movement
  - Approval workflow support

### API Endpoints
- `GET /api/inventory/movements` - Get inventory movements
- `POST /api/inventory/adjust` - Adjust inventory stock
- `GET /api/inventory/low-stock` - Get low stock alerts
- `GET /api/inventory/summary` - Get inventory summary
- `GET /api/inventory/history/:productId` - Get product stock history

### Features
- Automatic stock quantity updates
- Low stock alerts
- Inventory summary dashboard
- Stock movement history
- Cost tracking per movement
- Reference linking (invoices, expenses, purchase orders)

### Inventory Summary Includes
- Total products count
- Total inventory value
- Total quantity
- Low stock count
- Out of stock count
- Breakdown by category
- Breakdown by status (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, OVERSTOCK)

## Technical Implementation Details

### New Models
1. `Permission.js` - Permission definitions and role mappings
2. `Document.js` - Document management
3. `Currency.js` - Currency and exchange rates
4. `InventoryMovement.js` - Stock movement tracking

### New Services
1. `taxService.js` - Jamaican tax calculations
2. `backupService.js` - Backup and recovery operations

### New Controllers
1. `taxController.js` - Tax calculation endpoints
2. `backupController.js` - Backup management
3. `documentController.js` - Document management
4. `currencyController.js` - Currency operations
5. `inventoryController.js` - Inventory operations

### New Routes
1. `/api/tax` - Tax calculations
2. `/api/backup` - Backup operations
3. `/api/documents` - Document management
4. `/api/currencies` - Currency operations
5. `/api/inventory` - Inventory management

### Updated Models
1. `Invoice.js` - Added `taxType` and `customTaxRate` fields
2. `Tenant.js` - Expanded currency enum to support 18+ currencies
3. `User.js` - Already had role support (enhanced with permissions)

### Updated Services
1. `emailService.js` - Added password reset and reminder emails
2. `invoiceController.js` - Integrated tax service

### Updated Middleware
1. `auth.js` - Added `hasPermission()` middleware for granular access control

## Usage Examples

### Calculate Jamaican GCT
```javascript
POST /api/tax/calculate
{
  "subtotal": 1000,
  "taxType": "STANDARD"
}
// Returns: { subtotal: 1000, taxRate: 15, taxAmount: 150, total: 1150 }
```

### Create Backup
```javascript
POST /api/backup
{
  "fullBackup": false  // false = tenant-specific, true = full backup
}
```

### Upload Document
```javascript
POST /api/documents
FormData:
  - file: [file]
  - name: "Invoice Receipt"
  - category: "RECEIPT"
  - relatedTo: { type: "INVOICE", id: "..." }
```

### Convert Currency
```javascript
POST /api/currencies/convert
{
  "amount": 1000,
  "fromCode": "JMD",
  "toCode": "USD"
}
```

### Adjust Inventory
```javascript
POST /api/inventory/adjust
{
  "productId": "...",
  "quantity": 10,
  "movementType": "PURCHASE",
  "unitCost": 50,
  "reason": "Stock replenishment"
}
```

## Security & Access Control

- All new endpoints are protected with authentication
- Role-based access control for sensitive operations
- Permission-based access for granular control
- Tenant isolation maintained across all features
- Backup restore requires OWNER role
- Exchange rate updates require OWNER or ACCOUNTANT role

## Next Steps

To fully utilize these features:
1. Initialize currencies: `POST /api/currencies/initialize` (OWNER only)
2. Set up email service configuration in environment variables
3. Configure S3 storage for document uploads
4. Set up automatic backup scheduling (cron job recommended)
5. Initialize permissions in database (run permission initialization script)

## Notes

- All features are backward compatible
- Existing invoices will default to STANDARD tax type
- Currency conversion uses base currency (JMD) as reference
- Backups are stored locally by default, with optional S3 upload
- Document uploads require S3 configuration
- Inventory movements automatically update product stock quantities

