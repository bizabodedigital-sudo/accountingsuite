# Bizabode Accounting Suite --- System Architecture (MongoDB Backend)

## 🏗️ 1. System Overview

Bizabode Accounting Suite is a full-featured cloud accounting and
bookkeeping platform designed for small to medium-sized Jamaican
businesses. The backend is built on **Node.js + Express** with
**MongoDB** as the core data store, emphasizing simplicity, automation,
and scalability.

**Core Capabilities:** - Invoicing, Credit Notes, Purchase Orders - Bank
Reconciliation & Profit/Loss Reports - Tax Handling, Multi-Currency,
Recurring Invoices - Drag-and-Drop Imports/Exports (CSV, Excel, PDF) -
Inventory Management & Alerts - Auto Backups, Data Recovery, and
Role-Based Access

------------------------------------------------------------------------

## ⚙️ 2. Technology Stack

  --------------------------------------------------------------------------
  Layer            Technology                  Description
  ---------------- --------------------------- -----------------------------
  **Frontend**     Next.js + TailwindCSS +     Clean, responsive web
                   ShadCN/UI                   interface

  **Backend**      Node.js + Express           RESTful API with modular
                                               routes

  **Database**     MongoDB                     Flexible document store for
                                               invoices, customers, etc.

  **ORM/ODM**      Mongoose                    Schema-based modeling for
                                               MongoDB

  **Queue**        BullMQ + Redis              For async imports, emails,
                                               and backups

  **Auth**         JWT + bcrypt                Secure stateless
                                               authentication

  **Storage**      AWS S3 / DigitalOcean       For backups and file uploads
                   Spaces                      

  **Deployment**   Docker + Coolify (Hetzner)  Containerized auto-deploy
                                               setup
  --------------------------------------------------------------------------

------------------------------------------------------------------------

## 📁 3. Folder Structure

    backend/
    │
    ├── src/
    │   ├── config/        # DB, env, constants
    │   ├── models/        # Mongoose schemas
    │   ├── controllers/   # Core logic
    │   ├── routes/        # API endpoints
    │   ├── middleware/    # Auth, validation
    │   ├── services/      # Import, reports, backup
    │   └── utils/         # Helpers and formatters
    │
    ├── tests/
    │── package.json
    │── dockerfile
    │── docker-compose.yml

------------------------------------------------------------------------

## 🧱 4. MongoDB Schema Overview

### Invoice Schema

``` js
const invoiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Types.ObjectId, required: true, index: true },
  customerId: { type: mongoose.Types.ObjectId, ref: "Customer" },
  number: { type: String, required: true },
  type: { type: String, enum: ["INVOICE", "CREDIT_NOTE", "PO"], default: "INVOICE" },
  items: [
    { description: String, qty: Number, unitPrice: Number, taxRate: Number, total: Number }
  ],
  subtotal: Number,
  taxTotal: Number,
  total: Number,
  currency: { type: String, default: "JMD" },
  status: { type: String, enum: ["DRAFT", "SENT", "PAID", "VOID"], default: "DRAFT" },
  issueDate: Date,
  dueDate: Date,
  notes: String,
  deletedAt: Date,
}, { timestamps: true });
```

### Customer Schema

``` js
const customerSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Types.ObjectId, required: true, index: true },
  name: String,
  email: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});
```

### Expense Schema

``` js
const expenseSchema = new mongoose.Schema({
  tenantId: mongoose.Types.ObjectId,
  vendorId: mongoose.Types.ObjectId,
  category: String,
  amount: Number,
  currency: { type: String, default: "JMD" },
  expenseDate: Date,
  notes: String,
});
```

------------------------------------------------------------------------

## 🔌 5. API Route Structure

  Endpoint                 Method     Description
  ------------------------ ---------- -----------------------------------
  `/api/auth/login`        POST       Authenticate user and return JWT
  `/api/invoices`          GET/POST   Create or list invoices
  `/api/customers`         CRUD       Manage customers
  `/api/vendors`           CRUD       Manage vendors
  `/api/items`             CRUD       Manage inventory items
  `/api/payments`          CRUD       Record invoice payments
  `/api/expenses`          CRUD       Log business expenses
  `/api/reports/pnl`       GET        Profit & Loss report
  `/api/reports/balance`   GET        Balance sheet report
  `/api/imports`           POST       Upload and stage files for import
  `/api/exports`           GET        Download CSV/Excel/PDF exports
  `/api/backup`            POST       Trigger data snapshot

------------------------------------------------------------------------

## 🧠 6. Tenant Isolation

Every document includes a `tenantId` field.

Middleware ensures tenant context:

``` js
req.user = jwt.verify(token, process.env.JWT_SECRET);
const tenantFilter = { tenantId: req.user.tenantId };
await Invoice.find(tenantFilter);
```

Optional helper wrapper to automatically inject tenant filters into
Mongoose queries.

------------------------------------------------------------------------

## 🔄 7. Import / Export Logic

**Imports** 1. User uploads CSV or Excel → staged in `staging_imports`
2. Worker validates & normalizes data 3. Commits to target collections
with logs

**Exports** - Supports JSON, CSV, XLSX, PDF -
`/api/exports/invoices?format=xlsx` - Uses `json2csv`, `exceljs`,
`pdfkit` libraries

------------------------------------------------------------------------

## 💾 8. Backup & Recovery

**Automatic Backups** - Daily backup of tenant collections → S3/Spaces -
Manual trigger `/api/backup` → snapshot JSON dump

**Recovery** - "Undo delete" → marks `deletedAt: null` - Restore
snapshots by tenant from backup bucket

------------------------------------------------------------------------

## 🔐 9. Security & Access

-   JWT-based user authentication
-   bcrypt password hashing
-   Rate limiting and CORS middleware
-   Role-based routes (`OWNER`, `ACCOUNTANT`, `STAFF`)
-   Activity logs for audit trails
-   HTTPS enforced through reverse proxy

------------------------------------------------------------------------

## 🚀 10. Deployment (Docker + Coolify)

**docker-compose.yml**

``` yaml
version: "3.8"
services:
  api:
    build: .
    environment:
      - MONGODB_URI=mongodb://mongo:27017/bizabode
      - JWT_SECRET=supersecret
    ports:
      - "4000:4000"
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7

volumes:
  mongo_data:
```

**ENV**

    MONGODB_URI=mongodb://mongo:27017/bizabode
    JWT_SECRET=supersecret
    NODE_ENV=production

Deploy easily via **Coolify → "Deploy from GitHub Repo"** using
Dockerfile auto-detection.

------------------------------------------------------------------------

## 📈 11. Scalability & Performance

-   **Indexes** on (`tenantId`, `date`, `status`)\
-   **Aggregation pipelines** for analytics\
-   **Redis caching** for reports\
-   **BullMQ** queues for imports, backups, emails\
-   Future: **MongoDB Sharding** for multi-tenant scaling

------------------------------------------------------------------------

## 🧩 12. UX/UI Integration Overview

Frontend communicates via REST APIs.\
UI built with **Next.js + Tailwind + ShadCN/UI** in white, blue, and
black professional tones.

Principles: - Clean, responsive, accessible - Minimal friction and
intuitive forms - Clear table views with inline actions - Realtime
updates using WebSockets (optional)

------------------------------------------------------------------------

## 🧭 13. Summary

The Bizabode Accounting Suite backend (MongoDB edition) emphasizes:\
✅ Simplicity --- Modular, easy-to-deploy architecture\
✅ Security --- JWT + tenant isolation\
✅ Scalability --- Worker queues, sharding-ready design\
✅ Recovery --- Full backup/restore system\
✅ UX synergy --- Lightweight, modern API for clean frontends
