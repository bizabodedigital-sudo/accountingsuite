# Feature Access Guide - Where to Find New Features

## 🎯 Quick Access Links

### 1. **Payment Recording with Partial Payments**
- **URL**: `/payments/create`
- **How to Access**: 
  - Click "Payments" in sidebar → Click "Record Payment" button
  - Or navigate directly to `/payments/create`
- **Features**:
  - Select invoice
  - See remaining balance and previous payments
  - Enter partial payment amount
  - Payment gateway buttons (Stripe, PayPal)
  - Full payment button

### 2. **Quote Creation**
- **URL**: `/quotes/create`
- **How to Access**:
  - Click "Quotes" in sidebar → Click "Create Quote" button
  - Or navigate directly to `/quotes/create`
- **Features**:
  - Customer selection
  - Product/item selection
  - Tax calculation (GCT Standard, Zero Rated, Custom)
  - Expiry date picker
  - Save as draft or send immediately

### 3. **Quote to Invoice Conversion**
- **URL**: `/quotes`
- **How to Access**:
  - Click "Quotes" in sidebar
  - Find an APPROVED quote
  - Click the "Convert to Invoice" button (arrow icon)
- **Features**:
  - One-click conversion
  - Automatically redirects to created invoice

### 4. **Payroll Management**
- **URL**: `/payroll`
- **How to Access**:
  - Click "Payroll" in sidebar
- **Features**:
  - View all payroll records
  - Create new payroll: Click "Create Payroll" button
  - Filter by status (Draft, Approved, Paid)
  - View payroll details

### 5. **Payroll Creation**
- **URL**: `/payroll/create`
- **How to Access**:
  - From Payroll page: Click "Create Payroll" button
  - From Employees page: Click dollar icon on employee card
  - Or navigate directly to `/payroll/create?employeeId=XXX`
- **Features**:
  - Employee selection (pre-filled if from employee page)
  - Pay period dates
  - Earnings: Base salary, overtime, bonuses, allowances
  - Deductions: NIS, NHT, Education Tax, Income Tax, Pension, Health Insurance
  - Real-time calculation of gross pay, deductions, net pay
  - Auto-fills employee salary/overtime rates

### 6. **Employee Management**
- **URL**: `/employees`
- **How to Access**:
  - Click "Employees" in sidebar
- **Features**:
  - View all employees
  - Search and filter by status
  - Quick actions: View, Edit, Create Payroll, Delete
  - Add new employee: Click "Add Employee" button

### 7. **Employee Creation**
- **URL**: `/employees/create`
- **How to Access**:
  - From Employees page: Click "Add Employee" button
  - Or navigate directly to `/employees/create`
- **Features**:
  - Personal information
  - Employment details
  - Payroll details (salary, frequency, overtime rates)
  - Tax information (TRN, NIS)
  - Banking information
  - Address

### 8. **Bank Rules (Auto-Categorization)**
- **URL**: `/settings/bank-rules`
- **How to Access**:
  - Click "Settings" in sidebar
  - Expand "Accounting" section
  - Click "Bank Rules"
  - Or navigate directly to `/settings/bank-rules`
- **Features**:
  - Create rules to auto-categorize transactions
  - Match conditions: description, merchant, amount range, transaction type
  - Actions: assign account, category, tags, set description
  - Priority system
  - Test rules before applying
  - View rule statistics (match count)

### 9. **Dashboard Widgets**
- **URL**: `/dashboard`
- **How to Access**:
  - Click "Dashboard" in sidebar
  - Scroll down to "Dashboard Widgets" section
- **Features**:
  - Add widgets: Revenue Chart, AR Aging, Cash Flow, Quick Stats
  - Remove widgets
  - Widgets persist in localStorage
  - Real-time data from reports API

## 📍 Navigation Structure

### Sidebar Navigation
```
Dashboard
Invoices
Quotes          ← NEW
Payments        ← NEW (with Record Payment button)
Payroll         ← NEW
Employees       ← NEW
Products
Customers
Expenses
...
Settings
  └─ Accounting
      ├─ Chart of Accounts
      ├─ Opening Balances
      ├─ Financial Periods
      ├─ Journal Entries
      └─ Bank Rules        ← NEW
```

## 🔍 Quick Search

If you can't find a feature, try:
1. Check the sidebar - all main features are listed
2. Check Settings → Accounting for bank rules
3. Use browser search (Ctrl+F) on the page
4. Check the URL directly (e.g., `/payroll`, `/employees`, `/settings/bank-rules`)

## ✅ Verification Checklist

- [ ] Can see "Payroll" in sidebar
- [ ] Can see "Employees" in sidebar
- [ ] Can see "Quotes" in sidebar
- [ ] Can see "Payments" in sidebar
- [ ] Can access `/payroll` page
- [ ] Can access `/employees` page
- [ ] Can access `/quotes` page
- [ ] Can access `/payments` page
- [ ] Can access `/settings/bank-rules` page
- [ ] Can see "Bank Rules" in Settings → Accounting

## 🐛 Troubleshooting

If you don't see the features:
1. **Refresh the browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache**
3. **Check if frontend is running**: `cd frontend && npm run dev`
4. **Check browser console** for errors (F12)
5. **Verify routes are registered** in backend logs

## 📝 Notes

- All new pages are in `frontend/src/app/`
- All backend routes are registered in `backend/src/app.js`
- All API methods are in `frontend/src/lib/api.ts`
- Navigation is in `frontend/src/components/Sidebar.tsx`
- Settings navigation is in `frontend/src/app/settings/layout.tsx`

