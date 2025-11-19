# ✅ API URL Configuration - Confirmed Fix

## 🔍 Code Analysis

**Frontend code (`frontend/src/lib/api.ts`):**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001') 
    : 'http://localhost:3001');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,  // ← Adds /api here
```

**✅ Confirmed:** Code uses `NEXT_PUBLIC_API_URL` correctly.

**✅ Confirmed:** Code adds `/api` to the baseURL automatically.

---

## ❌ The Problem

**If `NEXT_PUBLIC_API_URL` includes `/api`:**
- `API_BASE_URL` = `https://accountingsuite.bizabodeserver.org/api`
- `baseURL` = `${API_BASE_URL}/api` = `https://accountingsuite.bizabodeserver.org/api/api` ❌

**Result:** Double `/api/api/` → 404 error

---

## ✅ The Fix

**`NEXT_PUBLIC_API_URL` should NOT include `/api`:**

**Correct:**
```
NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org
```

**Then:**
- `API_BASE_URL` = `https://accountingsuite.bizabodeserver.org`
- `baseURL` = `${API_BASE_URL}/api` = `https://accountingsuite.bizabodeserver.org/api` ✅

---

## 🔧 Files Fixed

### 1. `docker-compose.coolify.yml`
```yaml
args:
  NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-https://accountingsuite.bizabodeserver.org}  # ✅ No /api
```

### 2. `frontend/Dockerfile`
```dockerfile
ARG NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org  # ✅ No /api
```

---

## 🚀 Next Steps

### 1. Check Coolify Environment Variables

**In Coolify → Docker Compose App → Environment Variables:**

- **If `NEXT_PUBLIC_API_URL` exists:**
  - Should be: `https://accountingsuite.bizabodeserver.org` (NO `/api`)
  - NOT: `https://accountingsuite.bizabodeserver.org/api`

- **If it has `/api`:**
  - Edit and remove `/api`
  - Save

### 2. Rebuild Frontend

**⚠️ MUST REBUILD (not restart):**

- Go to Coolify → Frontend Service
- Click **Rebuild** or **Rebuild & Redeploy**
- Wait for build to complete

### 3. Verify

**After rebuild, check:**
- Network request: `POST .../api/auth/login` (single `/api`)
- NOT: `POST .../api/api/auth/login` (double `/api/api/`)

---

## ✅ Summary

- **Env Var Name:** `NEXT_PUBLIC_API_URL` ✅ (confirmed in code)
- **Value:** `https://accountingsuite.bizabodeserver.org` (NO `/api`)
- **Why:** Frontend code adds `/api` automatically
- **Action:** Rebuild frontend after fixing env var

---

## 🎯 Expected Result

**Before:**
```
POST https://accountingsuite.bizabodeserver.org/api/api/auth/login → 404
```

**After:**
```
POST https://accountingsuite.bizabodeserver.org/api/auth/login → 200 ✅
```

