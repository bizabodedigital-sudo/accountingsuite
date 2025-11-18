# Coolify Frontend Deployment - Step-by-Step Fix Guide

## Current Status

✅ **Backend is up** (FRONTEND_URL issue is fixed)  
✅ **Mongo, Redis, MinIO are fine**  
❌ **Frontend still not working** (SSL / 503 issues)

## Root Cause Analysis

The frontend issue is **either**:
1. The frontend container is not building / not running, **OR**
2. The domain/SSL is wired to the wrong service / wrong port

---

## Step 1: Verify Frontend Container Status

### In Coolify:

1. Open your **frontend** app (the one pointing to the `frontend` folder)

2. Look at the status at the top:
   - ✅ Should say: **Running · Healthy**
   - ❌ If it says: **Failed / Crashed / Unhealthy / Not deployed** → the reverse proxy has nothing to send traffic to

3. Click **Deployments** → open the **latest deployment** and check:
   - **Build logs** (top part)
   - **Runtime logs** (bottom part after "Container started…")

### What to Look For:

**If NO build logs at all:**
- Coolify is not even getting to your Dockerfile
- This is a repo/path config issue → **Go to Step 2**

**If there ARE logs:**
- Scroll to the **first red error** (search for `ERR` or `npm ERR!` or `Error:`)
- That's the real frontend failure
- Fix that error, then redeploy

---

## Step 2: Hard-Set Build Configuration

Still in the frontend app in Coolify:

### A. Repository / Build Path

**Location:** Coolify → Frontend → Settings → Build → "Build Path"

**Set EXACTLY to:**
```
frontend
```

> This tells Coolify "cd into the `frontend` folder, then build."

**NOT:**
- `/` (root)
- `app`
- `./app`
- `backend`
- Empty

---

### B. Dockerfile Path

**Location:** Coolify → Frontend → Settings → Build → "Dockerfile Path"

**With build path = `frontend`, set:**
```
Dockerfile
```

**NOT:**
- `frontend/Dockerfile` (this would be wrong if Build Path is already `frontend`)
- `./Dockerfile`
- Empty

**So effectively Coolify will run:**
```bash
cd frontend
docker build -f Dockerfile .
```

---

### C. Build Arguments

**Location:** Coolify → Frontend → Settings → Build → "Build Arguments"

**Add exactly:**
```
NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org/api
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

> Note: These match the defaults in the Dockerfile, but setting them here keeps it clean and explicit.

**Hit Save** after setting all three (Build Path, Dockerfile Path, Build Arguments).

---

## Step 3: Set Runtime Port + Domain

In the same frontend app:

### A. Ports / Networking

**Location:** Coolify → Frontend → Settings → Ports

**Set:**
- **Internal port:** `3000`

> This must match `EXPOSE 3000` in your Dockerfile and `next start` command.

**No need to expose other ports.**

---

### B. Domain & SSL

**Location:** Coolify → Frontend → Settings → Domains

**Configure:**
- **Domain:** `accountingsuite.bizabodeserver.org`
- **Make sure this domain is ONLY attached to the frontend app**, NOT the backend
- **SSL:** Enabled / Auto / "Generate certificate" pressed once

**⚠️ CRITICAL:** If this domain is also attached to the backend app:
1. Go to **Backend app → Domains**
2. **Remove** `accountingsuite.bizabodeserver.org` from there
3. Backend should use a different domain (e.g., `api.accountingsuite.bizabodeserver.org`)

---

## Step 4: Redeploy Cleanly

Now:

1. **Hit Redeploy** on the frontend app

2. **Watch build logs closely:**
   - You should see your `🔍 PRE-INSTALL DIAGNOSTICS`
   - You should see `🚀 STARTING NEXT.JS BUILD`
   - If `npm run build` fails, it will show up right there

3. **After the build, check Status:**
   - ✅ If "Running · Healthy" → the container is good
   - Then hit `https://accountingsuite.bizabodeserver.org` again in the browser
   - ❌ If still Failed/Unhealthy → the error is in those logs

---

## Step 5: Server-Side Sanity Check (Optional but Powerful)

If you have SSH access to the Coolify server:

### Check Container Status:
```bash
docker ps   # find the frontend container name
docker logs <frontend-container-name> --tail 100
```

### Test Container Directly:
If Coolify exposes port 3000 on the host:
```bash
curl http://localhost:3000
```

**Expected Results:**
- ✅ If that returns HTML → app is running, SSL/routing is the last piece
- ❌ If it errors → Next.js is not starting correctly (logs will show why)

---

## Quick Reference Checklist

Before redeploying, verify:

- [ ] **Build Path:** `frontend`
- [ ] **Dockerfile Path:** `Dockerfile` (not `frontend/Dockerfile`)
- [ ] **Build Arguments:** Both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are set
- [ ] **Internal Port:** `3000`
- [ ] **Domain:** `accountingsuite.bizabodeserver.org` attached ONLY to frontend
- [ ] **SSL:** Enabled/Generated for the domain
- [ ] **Backend:** Does NOT have `accountingsuite.bizabodeserver.org` attached

---

## Expected Log Output (After Fix)

Once configured correctly, you should see in build logs:

```
========================================
🔍 PRE-INSTALL DIAGNOSTICS
========================================
Node.js version: v22.x.x
NPM version: 11.x.x
Working directory: /app
...
========================================
🚀 STARTING NEXT.JS BUILD
========================================
NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org/api
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
...
```

If you see this, the build is running and we can debug any actual build errors.

---

## Troubleshooting

### If Still No Logs After Step 2:

1. **Check Repository Access:**
   - Go to **Coolify → Sources**
   - Verify repository is accessible
   - If using deploy key and have multiple apps, switch to GitHub App

2. **Verify Git Branch:**
   - Ensure Coolify is pulling from `main` branch
   - Check if latest commits are visible

3. **Check Coolify Server Logs:**
   - If you have SSH access to Coolify server
   - Check Docker daemon logs
   - Check Coolify application logs

### If Build Logs Show But Build Fails:

1. **Scroll to the first error** (look for `ERR`, `Error:`, `npm ERR!`)
2. **Common issues:**
   - Missing dependencies
   - TypeScript errors
   - Environment variable issues
   - Memory issues (should be handled by `NODE_OPTIONS`)

### If Container Builds But Status Shows Unhealthy:

1. **Check runtime logs** (after "Container started…")
2. **Verify port 3000** is correct
3. **Check health check** configuration in Coolify

---

## The Key Idea

Right now, "frontend still not working" means:

- Either the **frontend container is not building/running**, or
- The **domain/SSL is not actually pointing at that healthy container**

Going through the steps above will surface the exact reason:

1. **Build path → Dockerfile path** → ensures Coolify finds your Dockerfile
2. **Build arguments** → ensures Next.js has the right env vars at build time
3. **Internal port** → ensures Coolify routes traffic correctly
4. **Domain attached only to frontend** → ensures SSL/routing goes to the right container
5. **Redeploy + read the build logs** → shows the real error (if any)

Once you've run that redeploy with the fixed build path and Dockerfile path, the next time you look at the **frontend build logs** you'll see the real message (even if it's a Next.js/TypeScript error). That's the last missing puzzle piece.

---

## Next Steps After Fix

Once the frontend is building and running:

1. ✅ Verify `https://accountingsuite.bizabodeserver.org` loads
2. ✅ Check browser console for any client-side errors
3. ✅ Verify API calls are going to the correct backend URL
4. ✅ Test authentication flow
5. ✅ Test key features (dashboard, invoices, etc.)

