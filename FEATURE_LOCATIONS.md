# Feature Locations - Where All New Features Are Added

This document shows exactly where each new feature was implemented in the codebase.

## 📁 Directory Structure Overview

```
backend/
├── src/
│   ├── models/          # Database models
│   ├── controllers/     # API controllers
│   ├── services/        # Business logic services
│   ├── routes/          # API routes
│   └── middleware/      # Authentication & authorization
```

---

## 1. 🧾 Jamaican Tax Calculation (GCT)

### Service
- **`backend/src/services/taxService.js`** ⭐ NEW
  - GCT calculation logic
  - Tax type handling (STANDARD, ZERO, EXEMPT, CUSTOM)
  - TRN validation
  - GCT registration checking

### Controller
- **`backend/src/controllers/taxController.js`** ⭐ NEW
  - `calculateTax()` - Calculate single tax
  - `calculateMultiItemTax()` - Calculate multi-item tax
  - `checkGCTRegistration()` - Check registration status
  - `validateTRN()` - Validate TRN format

### Routes
- **`backend/src/routes/tax.js`** ⭐ NEW
  - `POST /api/tax/calculate`
  - `POST /api/tax/calculate-multi`
  - `POST /api/tax/check-registration`
  - `POST /api/tax/validate-trn`

### Integration
- **`backend/src/controllers/invoiceController.js`** ✏️ MODIFIED
  - Added tax service import
  - Integrated tax calculation in `createInvoice()`

- **`backend/src/models/Invoice.js`** ✏️ MODIFIED
  - Added `taxType` field
  - Added `customTaxRate` field

---

## 2. 👥 Enhanced User Roles & Permissions

### Model
- **`backend/src/models/Permission.js`** ⭐ NEW
  - Permission schema
  - Role-based permission mappings
  - Default permissions list
  - Permission checking methods

### Middleware
- **`backend/src/middleware/auth.js`** ✏️ MODIFIED
  - Added `hasPermission()` middleware function
  - Permission-based access control

### User Model
- **`backend/src/models/User.js`** ✅ Already had roles
  - Roles: OWNER, ACCOUNTANT, STAFF, READONLY
  - No changes needed (already implemented)

---

## 3. 💾 Auto Backup and Recovery

### Service
- **`backend/src/services/backupService.js`** ⭐ NEW
  - `createBackup()` - Create database backup
  - `restoreBackup()` - Restore from backup
  - `listBackups()` - List available backups
  - `cleanupOldBackups()` - Cleanup old backups
  - `scheduleBackup()` - Schedule automatic backups

### Controller
- **`backend/src/controllers/backupController.js`** ⭐ NEW
  - `createBackup()` - API endpoint
  - `listBackups()` - API endpoint
  - `restoreBackup()` - API endpoint
  - `deleteBackup()` - API endpoint
  - `cleanupBackups()` - API endpoint

### Routes
- **`backend/src/routes/backup.js`** ⭐ NEW
  - `GET /api/backup` - List backups
  - `POST /api/backup` - Create backup
  - `POST /api/backup/restore/:backupName` - Restore backup
  - `DELETE /api/backup/:backupName` - Delete backup
  - `POST /api/backup/cleanup` - Cleanup old backups

### Backup Storage
- **`backend/backups/`** 📁 Directory (created automatically)
  - Stores JSON backup files
  - Organized by tenant and timestamp

---

## 4. 📧 Enhanced Email Options

### Service
- **`backend/src/services/emailService.js`** ✏️ MODIFIED
  - Added `sendPasswordResetEmail()` ⭐ NEW
  - Added `sendInvoiceReminderEmail()` ⭐ NEW
  - Added `sendCustomEmail()` ⭐ NEW
  - Added `generatePasswordResetEmailHTML()` ⭐ NEW
  - Added `generateInvoiceReminderEmailHTML()` ⭐ NEW
  - Existing methods unchanged:
    - `sendInvoiceEmail()` ✅
    - `sendWelcomeEmail()` ✅
    - `testConnection()` ✅

---

## 5. 💱 Multi-Currency Support

### Model
- **`backend/src/models/Currency.js`** ⭐ NEW
  - Currency schema
  - Exchange rate management
  - Currency conversion methods
  - Formatting methods

### Controller
- **`backend/src/controllers/currencyController.js`** ⭐ NEW
  - `getCurrencies()` - Get all currencies
  - `getCurrency()` - Get single currency
  - `convertCurrency()` - Convert between currencies
  - `updateExchangeRates()` - Update rates
  - `initializeCurrencies()` - Initialize defaults

### Routes
- **`backend/src/routes/currencies.js`** ⭐ NEW
  - `GET /api/currencies` - List currencies
  - `GET /api/currencies/:code` - Get currency
  - `POST /api/currencies/convert` - Convert currency
  - `PUT /api/currencies/rates` - Update rates
  - `POST /api/currencies/initialize` - Initialize

### Integration
- **`backend/src/models/Tenant.js`** ✏️ MODIFIED
  - Expanded currency enum from 4 to 18+ currencies
  - Added: CAD, AUD, JPY, CHF, CNY, INR, BRL, MXN, ZAR, SGD, HKD, NZD, KRW, TRY

---

## 6. 📄 Document Upload and Management

### Model
- **`backend/src/models/Document.js`** ⭐ NEW
  - Document schema
  - File metadata
  - Categorization
  - Tagging system
  - Related entity linking
  - Version control

### Controller
- **`backend/src/controllers/documentController.js`** ⭐ NEW
  - `uploadDocument()` - Upload document
  - `getDocuments()` - List documents
  - `getDocument()` - Get single document
  - `updateDocument()` - Update metadata
  - `deleteDocument()` - Delete document
  - `getDownloadUrl()` - Get download URL

### Routes
- **`backend/src/routes/documents.js`** ⭐ NEW
  - `GET /api/documents` - List documents
  - `POST /api/documents` - Upload document
  - `GET /api/documents/:id` - Get document
  - `PUT /api/documents/:id` - Update document
  - `DELETE /api/documents/:id` - Delete document
  - `GET /api/documents/:id/download` - Download URL

### Integration
- Uses existing **`backend/src/services/s3Service.js`** ✅
- Uses existing **`backend/src/controllers/fileController.js`** ✅ (for multer upload)

---

## 7. 📦 Enhanced Inventory Management

### Model
- **`backend/src/models/InventoryMovement.js`** ⭐ NEW
  - Inventory movement schema
  - Movement types tracking
  - Stock history
  - Cost tracking
  - Reference linking

### Controller
- **`backend/src/controllers/inventoryController.js`** ⭐ NEW
  - `getMovements()` - Get inventory movements
  - `adjustInventory()` - Adjust stock
  - `getLowStock()` - Get low stock alerts
  - `getInventorySummary()` - Get summary
  - `getStockHistory()` - Get product history

### Routes
- **`backend/src/routes/inventory.js`** ⭐ NEW
  - `GET /api/inventory/movements` - List movements
  - `POST /api/inventory/adjust` - Adjust inventory
  - `GET /api/inventory/low-stock` - Low stock alerts
  - `GET /api/inventory/summary` - Inventory summary
  - `GET /api/inventory/history/:productId` - Stock history

### Integration
- **`backend/src/models/Product.js`** ✅ Already had stock management
  - `stockQuantity` field
  - `minStockLevel` field
  - `maxStockLevel` field
  - `updateStock()` method
  - No changes needed, enhanced with movement tracking

---

## 🔧 Core Application Updates

### Main App File
- **`backend/src/app.js`** ✏️ MODIFIED
  - Added route imports:
    - `backupRoutes`
    - `documentRoutes`
    - `currencyRoutes`
    - `inventoryRoutes`
    - `taxRoutes`
  - Registered all new routes
  - Updated route logging

---

## 📊 Summary by File Type

### ⭐ New Files Created (15 files)

**Models (4):**
1. `backend/src/models/Permission.js`
2. `backend/src/models/Document.js`
3. `backend/src/models/Currency.js`
4. `backend/src/models/InventoryMovement.js`

**Services (2):**
1. `backend/src/services/taxService.js`
2. `backend/src/services/backupService.js`

**Controllers (5):**
1. `backend/src/controllers/taxController.js`
2. `backend/src/controllers/backupController.js`
3. `backend/src/controllers/documentController.js`
4. `backend/src/controllers/currencyController.js`
5. `backend/src/controllers/inventoryController.js`

**Routes (5):**
1. `backend/src/routes/tax.js`
2. `backend/src/routes/backup.js`
3. `backend/src/routes/documents.js`
4. `backend/src/routes/currencies.js`
5. `backend/src/routes/inventory.js`

**Documentation (2):**
1. `NEW_FEATURES.md`
2. `FEATURE_LOCATIONS.md` (this file)

### ✏️ Modified Files (5 files)

1. `backend/src/models/Invoice.js` - Added taxType and customTaxRate
2. `backend/src/models/Tenant.js` - Expanded currency enum
3. `backend/src/controllers/invoiceController.js` - Integrated tax service
4. `backend/src/services/emailService.js` - Added new email methods
5. `backend/src/middleware/auth.js` - Added hasPermission middleware
6. `backend/src/app.js` - Registered new routes

---

## 🗂️ File Locations Quick Reference

```
backend/src/
├── models/
│   ├── Permission.js          ⭐ NEW - Permissions system
│   ├── Document.js            ⭐ NEW - Document management
│   ├── Currency.js           ⭐ NEW - Currency & exchange rates
│   ├── InventoryMovement.js ⭐ NEW - Stock movement tracking
│   ├── Invoice.js            ✏️ MODIFIED - Added taxType
│   └── Tenant.js             ✏️ MODIFIED - Expanded currencies
│
├── services/
│   ├── taxService.js         ⭐ NEW - Jamaican tax calculations
│   ├── backupService.js      ⭐ NEW - Backup & recovery
│   └── emailService.js       ✏️ MODIFIED - Enhanced email options
│
├── controllers/
│   ├── taxController.js      ⭐ NEW - Tax API endpoints
│   ├── backupController.js   ⭐ NEW - Backup API endpoints
│   ├── documentController.js ⭐ NEW - Document API endpoints
│   ├── currencyController.js ⭐ NEW - Currency API endpoints
│   ├── inventoryController.js ⭐ NEW - Inventory API endpoints
│   └── invoiceController.js  ✏️ MODIFIED - Tax integration
│
├── routes/
│   ├── tax.js                ⭐ NEW - Tax routes
│   ├── backup.js             ⭐ NEW - Backup routes
│   ├── documents.js          ⭐ NEW - Document routes
│   ├── currencies.js         ⭐ NEW - Currency routes
│   └── inventory.js          ⭐ NEW - Inventory routes
│
├── middleware/
│   └── auth.js               ✏️ MODIFIED - Added hasPermission
│
└── app.js                    ✏️ MODIFIED - Registered new routes
```

---

## 🔍 How to Find Features

### By Feature Name:
- **Tax Calculation**: `taxService.js`, `taxController.js`, `tax.js`
- **Backup**: `backupService.js`, `backupController.js`, `backup.js`
- **Documents**: `Document.js`, `documentController.js`, `documents.js`
- **Currency**: `Currency.js`, `currencyController.js`, `currencies.js`
- **Inventory**: `InventoryMovement.js`, `inventoryController.js`, `inventory.js`
- **Permissions**: `Permission.js`, `auth.js` (hasPermission)
- **Email**: `emailService.js` (enhanced)

### By API Endpoint:
- `/api/tax/*` → `routes/tax.js` → `controllers/taxController.js`
- `/api/backup/*` → `routes/backup.js` → `controllers/backupController.js`
- `/api/documents/*` → `routes/documents.js` → `controllers/documentController.js`
- `/api/currencies/*` → `routes/currencies.js` → `controllers/currencyController.js`
- `/api/inventory/*` → `routes/inventory.js` → `controllers/inventoryController.js`

---

## 📝 Notes

- All new features follow the existing codebase patterns
- All routes are protected with authentication
- Tenant isolation is maintained across all features
- All features are backward compatible
- No breaking changes to existing functionality

