# Fix Coolify Environment Variable Template Error

## ❌ Error

```
failed to read /artifacts/.../.env: Invalid template: "${MINIO_ROOT_USER:-minioadmin"
exit status 1
```

## 🔍 Cause

Coolify is trying to parse environment variables with template syntax, but there's a **malformed template** in your Coolify environment variables.

The error shows: `${MINIO_ROOT_USER:-minioadmin` (missing closing brace `}`)

## ✅ Solution

### Option 1: Remove MinIO Variables (Recommended if not using MinIO)

Since we're not using MinIO in the docker-compose setup, remove these variables from Coolify:

1. **Go to Coolify** → Your Docker Compose Resource → **Environment Variables**
2. **Remove or fix these variables:**
   - `MINIO_ROOT_USER` - **DELETE** or set to a plain value (not template)
   - `MINIO_ROOT_PASSWORD` - **DELETE** or set to a plain value (not template)

3. **If you see any variable with malformed template syntax like:**
   ```
   ${VAR:-default    ← Missing closing brace
   ```
   **Fix it to:**
   ```
   ${VAR:-default}   ← Proper syntax
   ```
   **OR just use a plain value:**
   ```
   default
   ```

### Option 2: Fix the Template Syntax

If you need to use MinIO variables, fix the syntax:

**❌ Wrong:**
```
MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin
```

**✅ Correct:**
```
MINIO_ROOT_USER=minioadmin
```

**OR if you want to use template syntax:**
```
MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
```

### Option 3: Set Plain Values (Easiest)

Instead of using template syntax, just set plain values in Coolify:

1. **Go to Environment Variables**
2. **Set these to plain values:**
   ```
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin123
   ```

## 🔧 Step-by-Step Fix

### Step 1: Go to Coolify Environment Variables

1. Open your Docker Compose resource in Coolify
2. Go to **"Environment Variables"** or **"Variables"** section
3. Look for variables with `MINIO_` prefix

### Step 2: Check for Malformed Templates

Look for variables that have:
- Missing closing brace `}`
- Incomplete template syntax
- Variables that look like: `${VAR:-value` (missing `}`)

### Step 3: Fix or Remove

**If not using MinIO:**
- **Delete** `MINIO_ROOT_USER`
- **Delete** `MINIO_ROOT_PASSWORD`
- **Delete** any other `MINIO_*` variables

**If using MinIO:**
- Set to plain values: `MINIO_ROOT_USER=minioadmin`
- Or fix template: `${MINIO_ROOT_USER:-minioadmin}`

### Step 4: Save and Redeploy

1. **Save** the environment variables
2. **Redeploy** your Docker Compose resource
3. The error should be gone

## 📋 Required Environment Variables

For the current docker-compose.yml, you only need:

### Required:
```
JWT_SECRET=your-secret-key
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Optional:
```
JWT_EXPIRES_IN=24h
S3_ENDPOINT=http://minio:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

**Note:** If you're not using MinIO/S3, you don't need the S3_* variables at all.

## ⚠️ Common Mistakes

### ❌ Don't use incomplete templates:
```
MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin    ← Missing }
```

### ✅ Use plain values:
```
MINIO_ROOT_USER=minioadmin
```

### ✅ Or complete templates:
```
MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
```

## 🎯 Quick Fix

**Fastest solution if not using MinIO:**

1. Go to Coolify → Environment Variables
2. Delete all `MINIO_*` variables
3. Save
4. Redeploy

This will fix the error immediately.

