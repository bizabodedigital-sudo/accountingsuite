# Frontend URL Configuration

## Required Environment Variables

Set these in **Coolify** → Your Docker Compose Resource → **Environment Variables**:

### For Frontend Build (Build Arguments)

These MUST be set as **Build Arguments** in Coolify for the frontend service:

```
NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org
```

### For Runtime (Environment Variables)

Set these as **Environment Variables** (runtime):

```
NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org
FRONTEND_URL=https://accountingsuites.bizabodeserver.org
BACKEND_URL=http://backend:3001
```

## How to Set in Coolify

### Step 1: Set Build Arguments

1. Go to **Coolify** → Your Docker Compose Resource
2. Click on **Frontend** service
3. Go to **Settings** → **Build Arguments**
4. Add:
   - `NEXT_PUBLIC_API_URL` = `https://api.accountingsuites.bizabodeserver.org`
   - `NEXT_PUBLIC_APP_URL` = `https://accountingsuites.bizabodeserver.org`

### Step 2: Set Environment Variables

1. Go to **Environment Variables** (shared or per-service)
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
   NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org
   FRONTEND_URL=https://accountingsuites.bizabodeserver.org
   ```

### Step 3: Rebuild Frontend

After setting the variables:
1. **Rebuild** the frontend service (to apply build arguments)
2. Or **Redeploy** the entire Docker Compose resource

## Domain Configuration

### Frontend Domain
- **Domain:** `accountingsuites.bizabodeserver.org`
- **Service:** `frontend`
- **Port:** `3000`
- **HTTPS:** Enabled

### Backend API Domain (Optional)
- **Domain:** `api.accountingsuites.bizabodeserver.org`
- **Service:** `backend`
- **Port:** `3001`
- **HTTPS:** Enabled

## Important Notes

1. **Build Arguments vs Environment Variables:**
   - Build arguments are used **during build time** (embedded in the Next.js bundle)
   - Environment variables are used **at runtime**
   - Both should be set to the same values

2. **After Changing URLs:**
   - You **MUST rebuild** the frontend (build arguments change the build)
   - Just restarting won't work - the URLs are embedded in the build

3. **HTTPS:**
   - Always use `https://` in production
   - Coolify handles SSL certificates automatically

## Current Configuration

- **Frontend URL:** `https://accountingsuites.bizabodeserver.org`
- **API URL:** `https://api.accountingsuites.bizabodeserver.org`

Make sure these match your actual domains in Coolify!

