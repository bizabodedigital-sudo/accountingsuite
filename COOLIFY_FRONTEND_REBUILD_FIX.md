# 🔧 Fix Double /api/api/ Error - Frontend Rebuild Required

## ❌ Current Issue

**Error:** `POST https://accountingsuite.bizabodeserver.org/api/api/auth/login 404 (Not Found)`

**Problem:** Frontend is still using old build with incorrect API URL.

---

## ✅ Fix Applied

**Changed in `docker-compose.coolify.yml`:**
- **Before:** `NEXT_PUBLIC_API_URL: .../api` 
- **After:** `NEXT_PUBLIC_API_URL: ...` (removed `/api`)

**Why:** Frontend code already adds `/api` to the baseURL (see `frontend/src/lib/api.ts` line 12).

---

## 🚀 Steps to Fix

### Step 1: Check Coolify Environment Variables

**In Coolify → Docker Compose App → Environment Variables:**

1. Check if `NEXT_PUBLIC_API_URL` is set
2. **If it exists and includes `/api`:**
   - Edit it
   - Change from: `https://accountingsuite.bizabodeserver.org/api`
   - Change to: `https://accountingsuite.bizabodeserver.org` (remove `/api`)
   - Save

3. **If it doesn't exist:**
   - The docker-compose default will be used (which is now correct)
   - No action needed

---

### Step 2: Rebuild Frontend Service

**⚠️ IMPORTANT: Must REBUILD, not just restart!**

**In Coolify → Docker Compose App:**

1. Go to **Frontend Service**
2. Click **Rebuild** or **Rebuild & Redeploy**
3. **NOT** just "Restart" - that won't pick up the new env var

**Why rebuild?**
- `NEXT_PUBLIC_*` variables are embedded at **build time**
- Next.js bakes them into the JavaScript bundle
- Restart won't change them - must rebuild

---

### Step 3: Wait for Build to Complete

**After rebuilding:**

1. Wait for frontend service to be **Running** and **Healthy**
2. Check logs to confirm build succeeded
3. Should see: `✓ Ready in Xms`

---

### Step 4: Test Login Again

**After rebuild:**

1. Clear browser cache (or use Incognito)
2. Go to: `https://accountingsuite.bizabodeserver.org/login`
3. Try logging in again
4. Check browser DevTools → Network tab
5. Should see: `POST .../api/auth/login` (NOT `/api/api/auth/login`)

---

## 🔍 Verify Fix

**Check Network Request:**

**Before fix:**
```
POST https://accountingsuite.bizabodeserver.org/api/api/auth/login → 404
```

**After fix:**
```
POST https://accountingsuite.bizabodeserver.org/api/auth/login → 200
```

---

## 📋 Checklist

- [ ] Checked Coolify env vars for `NEXT_PUBLIC_API_URL`
- [ ] Removed `/api` from `NEXT_PUBLIC_API_URL` if present
- [ ] **Rebuilt** frontend service (not just restarted)
- [ ] Frontend service is Running and Healthy
- [ ] Cleared browser cache
- [ ] Tested login
- [ ] Network request shows correct URL (no double `/api/api/`)

---

## 🆘 Still Not Working?

**If still seeing `/api/api/` after rebuild:**

1. **Check Coolify env vars again** - might be overriding docker-compose
2. **Check frontend build logs** - verify `NEXT_PUBLIC_API_URL` value
3. **Hard refresh browser** - Ctrl+Shift+R or clear cache completely
4. **Check if multiple env vars** - might have duplicate definitions

---

## ✅ Success Indicators

After rebuild:
- ✅ Network request: `.../api/auth/login` (single `/api`)
- ✅ Status: 200 OK (not 404)
- ✅ Login works successfully
- ✅ Redirects to dashboard

---

## 💡 Why This Happened

**Next.js Environment Variables:**
- `NEXT_PUBLIC_*` vars are embedded at **build time**
- They become part of the JavaScript bundle
- Changing them requires **rebuilding**, not just restarting
- This is different from regular env vars that are read at runtime

**The Fix:**
- Removed `/api` from `NEXT_PUBLIC_API_URL` default
- Frontend code already adds `/api` to baseURL
- Now: `baseURL = ${API_BASE_URL}/api` = `.../api` ✅
- Before: `baseURL = ${API_BASE_URL}/api` = `.../api/api` ❌

