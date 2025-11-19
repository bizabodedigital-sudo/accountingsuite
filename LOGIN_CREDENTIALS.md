# 🔐 Login Credentials Guide

## ✅ Frontend is Working!

If you're seeing the login page, that means the 502 error is fixed! 🎉

---

## 📋 Default Login Credentials

**If you've run the database seed script**, you can use these default credentials:

### Owner Account (Full Access)
- **Email:** `owner@jamaicatech.com`
- **Password:** `password123`
- **Role:** OWNER (full system access)

### Accountant Account
- **Email:** `accountant@jamaicatech.com`
- **Password:** `password123`
- **Role:** ACCOUNTANT (accounting functions)

### Staff Account
- **Email:** `staff@jamaicatech.com`
- **Password:** `password123`
- **Role:** STAFF (limited access)

---

## 🚀 First Time Setup

### Option 1: Register a New Account

**If no users exist yet:**

1. Go to: `https://accountingsuite.bizabodeserver.org/register`
   - Or click "Register" link on login page
2. Fill in:
   - Email
   - Password
   - First Name
   - Last Name
   - Company/Tenant Name
3. Click "Register"
4. You'll be automatically logged in as OWNER

### Option 2: Seed Database with Default Users

**To create the default users above:**

1. **In Coolify → Backend Service → Terminal:**

```bash
cd /app
node scripts/seed-database.js
```

**Or if running locally:**

```bash
node scripts/seed-database.js
```

2. **After seeding, use default credentials:**
   - `owner@jamaicatech.com` / `password123`

---

## 🔑 Login Endpoints

### Main Application Login
- **URL:** `https://accountingsuite.bizabodeserver.org/login`
- **API:** `POST /api/auth/login`
- **For:** System users (OWNER, ACCOUNTANT, STAFF)

### Client Portal Login
- **URL:** `https://accountingsuite.bizabodeserver.org/client-portal/login`
- **API:** `POST /api/client-auth/login`
- **For:** Customers accessing their portal

---

## ⚠️ Security Notes

**IMPORTANT:**
- ⚠️ Default passwords are for **development/testing only**
- ⚠️ **Change passwords immediately** after first login
- ⚠️ Use strong passwords in production
- ⚠️ Don't use default credentials in production

---

## 🆘 Troubleshooting

### "Invalid credentials" Error

**Possible causes:**
1. **No users exist** → Register a new account or seed database
2. **Wrong email/password** → Check credentials
3. **Account inactive** → Check user status in database
4. **Database not connected** → Check backend logs

### "User already exists" Error

**When registering:**
- Email is already in use
- Try logging in instead
- Or use different email

### Can't Access Login Page

**If you get 502 or other errors:**
- Check frontend service is running
- Check domain configuration
- Check backend API is accessible

---

## 📝 User Roles

### OWNER
- Full system access
- Can manage all settings
- Can create/manage users
- Can access all features

### ACCOUNTANT
- Accounting functions
- Can create invoices, expenses
- Can manage financial data
- Limited settings access

### STAFF
- Basic access
- Can view/create invoices
- Limited financial access
- No settings access

### READONLY
- View-only access
- Cannot create/edit data
- Read-only mode

---

## 🔧 Creating Users Manually

**Via API:**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "My Company"
}
```

**Via Database:**

Users are stored in MongoDB `users` collection. You can create users directly in the database if needed.

---

## ✅ Success!

Once logged in, you should see:
- Dashboard
- Navigation menu
- Access to all features based on your role

**Congratulations on getting the application running!** 🎉

