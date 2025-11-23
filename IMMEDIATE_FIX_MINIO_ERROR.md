# ⚠️ IMMEDIATE FIX: MinIO Template Error

## The Error

```
Invalid template: "${MINIO_ROOT_USER:-minioadmin"
```

## 🔧 Quick Fix (2 Steps)

### Step 1: Go to Coolify Environment Variables

1. **Open Coolify** → Your Docker Compose Resource
2. **Click "Environment Variables"** or **"Variables"**
3. **Find and DELETE these variables:**
   - `MINIO_ROOT_USER`
   - `MINIO_ROOT_PASSWORD`
   - Any other `MINIO_*` variables

**Why?** Your `docker-compose.yml` doesn't use MinIO, so these variables aren't needed and are causing the error.

### Step 2: Save and Redeploy

1. **Click "Save"**
2. **Click "Redeploy"** or **"Rebuild"**
3. **Error should be gone!** ✅

## 📋 Required Variables Only

Your `docker-compose.yml` only needs these variables:

### Required:
```
JWT_SECRET=your-secret-key
FRONTEND_URL=https://accountingsuite.bizabodeserver.org
NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

### Optional:
```
JWT_EXPIRES_IN=24h
```

**That's it!** No MinIO variables needed.

## 🎯 Why This Happens

Coolify tries to validate ALL environment variables, even if they're not used in your docker-compose.yml. If a variable has malformed template syntax like `${VAR:-value` (missing `}`), it fails.

Since we're not using MinIO in the current setup, just delete those variables.

## ✅ After Fixing

Once you delete the MinIO variables and redeploy:
- ✅ Build will start
- ✅ Services will deploy
- ✅ No more template errors

---

**TL;DR: Delete `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from Coolify environment variables, then redeploy.**

