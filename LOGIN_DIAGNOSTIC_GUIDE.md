# Login Diagnostic & Fix Guide

## Quick Fix: Run These Commands in Coolify Backend Terminal

### Step 1: Check Database State
```bash
cd /app
node src/scripts/check-database.js
```

This will show:
- How many users exist
- If passwords are hashed correctly
- If password comparison works

### Step 2: Fix Passwords (if needed)
```bash
cd /app
node src/scripts/fix-passwords.js
```

This will:
- Create users if they don't exist
- Fix any unhashed passwords
- Reset passwords to `password123` if they don't match
- Verify all passwords work

### Step 3: Test Login
After running the fix script, try logging in with:
- **Email:** `owner@jamaicatech.com`
- **Password:** `password123`

## Common Issues & Solutions

### Issue 1: No Users in Database
**Symptom:** `check-database.js` shows `User count: 0`

**Solution:** Run the fix script:
```bash
node src/scripts/fix-passwords.js
```

### Issue 2: Passwords Not Hashed
**Symptom:** `check-database.js` shows password length < 50 characters

**Solution:** Run the fix script:
```bash
node src/scripts/fix-passwords.js
```

### Issue 3: Password Mismatch
**Symptom:** `check-database.js` shows password doesn't match `password123`

**Solution:** Run the fix script:
```bash
node src/scripts/fix-passwords.js
```

### Issue 4: Database Connection Failed
**Symptom:** Error: `MongoDB connection error`

**Solution:** 
1. Check `MONGODB_URI` environment variable in Coolify
2. Verify MongoDB service is running
3. Check MongoDB credentials are correct

## Alternative: Full Seed Script

If the fix script doesn't work, run the full seed script:

```bash
cd /app
node src/scripts/seed.js
```

**Warning:** This will DELETE all existing data and recreate it!

## Default Login Credentials

After running any of the above scripts:

- **Owner:** `owner@jamaicatech.com` / `password123`
- **Accountant:** `accountant@jamaicatech.com` / `password123`
- **Staff:** `staff@jamaicatech.com` / `password123`

## Verification

After fixing, verify login works:

1. Go to: `https://accountingsuite.bizabodeserver.org/login`
2. Enter: `owner@jamaicatech.com` / `password123`
3. Should redirect to dashboard

## Still Can't Login?

Check backend logs in Coolify for:
- Database connection errors
- Authentication errors
- JWT token errors

Look for lines like:
- `Login failed: MongoDB is not connected`
- `Invalid credentials`
- `Database connection unavailable`

