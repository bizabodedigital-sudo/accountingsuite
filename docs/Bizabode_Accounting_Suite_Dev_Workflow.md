# Bizabode Accounting Suite — Developer Action Plan & Workflow (MongoDB Edition)

## 0) Summary
A modern invoicing & bookkeeping SaaS for Jamaican SMEs. Stack: **Next.js (Tailwind + ShadCN/UI)** + **Node.js/Express** + **MongoDB (Mongoose)** + **BullMQ/Redis** + **S3/DO Spaces** on **Docker/Coolify**.

---

## 1) Tech Stack
| Layer | Stack | Notes |
|---|---|---|
| Frontend | Next.js 15, TailwindCSS, ShadCN/UI, React Query, React Hook Form + Zod, Recharts, Framer Motion | Clean, responsive UI |
| Backend | Node.js, Express, Mongoose (MongoDB 7.x) | REST API, modular services |
| Queue/Cache | BullMQ, Redis | Imports, backups, emails |
| Storage | DigitalOcean Spaces / AWS S3 | Uploads, backups |
| Auth | JWT, bcrypt | Stateless, role-aware |
| Monitoring | PM2, Sentry, Prometheus (optional) | Logs/metrics |
| Deploy | Docker, Coolify (Hetzner) | HTTPS, env secrets |

---

## 2) Modules & Priorities
| Module | Description | Priority |
|---|---|---|
| Auth & Tenancy | JWT, roles, `tenantId` isolation | 🔥 Phase 1 |
| Invoicing | CRUD, send, recurring | 🔥 Phase 1 |
| Expenses & Vendors | Expense log, vendor mgmt | 🔥 Phase 1 |
| Customers | Contacts, history | 🔥 Phase 1 |
| Reports | P&L, Balance Sheet | ⚙️ Phase 2 |
| Inventory | Items, qty_on_hand, alerts | ⚙️ Phase 2 |
| Imports/Exports | CSV/XLSX/PDF | ⚙️ Phase 2 |
| Backups & Recovery | Daily snapshots, undo | ⚙️ Phase 3 |
| Admin Panel | Plans/limits, usage | ⚙️ Phase 3 |

---

## 3) Milestones & Timeline
### Phase 1 — Foundation (Week 1–3)
- Monorepo setup: `/backend`, `/frontend`, `/shared`, `/docs`
- `.env` (Mongo, JWT, Redis) + Docker Compose
- Auth (register/login), JWT middleware, RBAC skeleton
- Models: Tenant, User, Customer, Vendor, Invoice, Expense
- API: CRUD for Invoices, Expenses, Customers
- Frontend: Auth flow, Dashboard shell, Invoice create
- CI (lint/test) + sample data seeds

**Deliverable:** Working auth + invoice/expense creation.

### Phase 2 — Automation & Reports (Week 4–6)
- BullMQ workers (imports, emails, backups)
- Reports: `/reports/pnl`, `/reports/balance` (agg pipelines)
- Exports: `/exports/invoices?format=xlsx|csv|pdf`
- Inventory module (items, stock, thresholds)
- SMTP email (Nodemailer), S3/Spaces integration
- UX polish: tables, filters, skeleton loaders

**Deliverable:** Accounting core with reporting & automation.

### Phase 3 — Scale & Ops (Week 7–9)
- Roles & Permissions editor UI
- Auto-backups (cron) + restore path
- Index tuning, Redis caching
- Admin dashboard for plan limits/usage
- Prod deployment on Hetzner via Coolify
- QA pass, perf baseline, docs

**Deliverable:** Private beta release.

---

## 4) Backend Structure
```
backend/
  src/
    config/        # env, db, logger
    middleware/    # auth, rbac, error
    models/        # mongoose schemas
    controllers/   # business logic
    routes/        # express routers
    services/      # import/export, email, reports
    workers/       # bullmq jobs
  tests/
  dockerfile
  docker-compose.yml
```

### Key Schemas (Mongoose)
- **Tenant**: name, currency (JMD), plan
- **User**: email, passwordHash, role (OWNER|ACCOUNTANT|STAFF|READONLY), tenantId
- **Customer/Vendor**: name, contact, tenantId
- **Item**: sku, name, unitPrice, trackInventory, qtyOnHand, tenantId
- **Invoice**: number, type (INVOICE|CREDIT_NOTE|PO), items[], totals, status, dates, tenantId
- **Payment**: invoiceId, amount, date, method, tenantId
- **Expense**: vendorId, category, amount, date, tenantId
- **ChangeLog**: entity, before/after, actor, timestamp (for recovery)

### Core Endpoints
- `/api/auth/login`, `/api/auth/register`
- `/api/tenants`, `/api/users`
- `/api/customers`, `/api/vendors`, `/api/items`
- `/api/invoices` (CRUD), `/api/invoices/:id/send`, `/api/invoices/:id/void`
- `/api/payments` (create/list by invoice)
- `/api/expenses` (CRUD)
- `/api/reports/pnl`, `/api/reports/balance`
- `/api/imports` (upload + stage), `/api/exports/*`
- `/api/backup` (manual snapshot)

### Middleware Snippets
```js
// auth.js
export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Not authorized" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(403).json({ error: "Invalid token" }); }
};
```

```js
// tenantGuard.js
export const tenantFilter = (model) => (req, res, next) => {
  req.tenantQuery = (extra = {}) => ({ tenantId: req.user.tenantId, ...extra });
  next();
};
```

---

## 5) Frontend Structure
```
frontend/
  app/
    layout.tsx
    dashboard/page.tsx
    invoices/ (list, create, view)
    expenses/
    reports/
    settings/
  components/
    ui/        # shadcn components
    forms/     # RHF + Zod
    charts/
  lib/         # api client, utils
  styles/
```

### UI Guidelines
- Colors: **white** base, **black** text, **blue** accents (#007BFF)
- Typography: **Inter** / **Poppins**
- Components: rounded-2xl, shadow-md, generous spacing
- Feedback: toasts, inline validation, skeleton loaders
- Accessibility: 16px base, high contrast, focus rings

### Key Screens
- **Dashboard**: KPIs (Income, Expenses, Net), trend chart, recent activity
- **Invoices**: table + side drawer editor, send preview, status chips
- **Expenses**: filters by date/vendor/category, quick add
- **Reports**: P&L with date presets, export buttons
- **Settings**: roles, backups, company profile

---

## 6) Imports/Exports & Backups
- **Imports**: stage in `staging_imports` collection; BullMQ worker validates/commits; error CSV export
- **Exports**: CSV (`json2csv`), Excel (`exceljs`), PDF (`pdfkit`)
- **Backups**: daily cron → S3/Spaces; manual `/api/backup`; restore by tenant

---

## 7) Security & Compliance
- JWT exp (1h) + refresh strategy (Phase 2)
- bcrypt hash rounds (>=12)
- RBAC per route; server-side tenant filters
- HTTPS via Coolify reverse proxy; CORS locked to app domain
- Audit logs for sensitive actions
- Offsite encrypted backups (SSE/KMS)

---

## 8) Observability & QA
- Logs: pino (JSON), requestId, tenantId
- Errors: Sentry
- Health: `/healthz` on API & worker
- Tests: Jest (unit), Supertest (API), Playwright (E2E)
- Load: Artillery scenarios for imports/reports

---

## 9) Deployment
- **Dev**: `docker-compose up -d`
- **Staging**: Coolify Git deploy, env in dashboard
- **Prod**: Hetzner VPS + Coolify, HTTPS, autosnapshots
- ENV:
```
MONGODB_URI=mongodb://mongo:27017/bizabode
JWT_SECRET=supersecret
REDIS_URL=redis://redis:6379
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=***
S3_SECRET_KEY=***
```

---

## 10) Acceptance Criteria (MVP)
- Create/send invoice with PDF
- Record expense and vendor
- View P&L report for date range
- Import customers/invoices from CSV
- Daily backup visible in Spaces
- Role-based access working
- Responsive UI (mobile/desktop)

---

## 11) Post-Launch Roadmap
- AI auto-categorization for expenses
- Bank CSV → reconciliation suggestions
- Tiered billing + metering
- Offline-capable PWA
- Multi-company accountant view
- Dark mode

---

## 12) Task Board Seeds (Sprint 1)
- [ ] Repo init (frontend/backend/shared)
- [ ] Docker Compose (api, mongo, redis)
- [ ] Mongo connect + healthcheck
- [ ] Auth routes + JWT middleware
- [ ] Models: Tenant, User, Customer, Vendor, Invoice, Expense
- [ ] CRUD: /customers, /invoices, /expenses
- [ ] Frontend: auth pages, dashboard shell
- [ ] CI: lint, tests, sample seed

---

**End Goal:** Deliver a sleek, trustworthy accounting suite with an intuitive UI and a robust, scalable backend. Built for **clarity, speed, and local compliance**.
