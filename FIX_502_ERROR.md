# Fix HTTP 502 Bad Gateway Error

## What is a 502 Error?

**HTTP 502 Bad Gateway** means Coolify's reverse proxy (Caddy) cannot reach your frontend service. The frontend container is either:
- Not running
- Crashed
- Not listening on the correct port
- Health check failing

## Quick Fix Steps

### Step 1: Check Frontend Container Status

1. Go to **Coolify** → Your Docker Compose Resource
2. Find the **frontend** service
3. Check status:
   - ✅ **Running** → Go to Step 2
   - ❌ **Stopped/Crashed** → Check logs (Step 3)
   - ⏳ **Starting** → Wait 2-3 minutes
   - ⚠️ **Unhealthy** → Check health check (Step 4)

### Step 2: Check Frontend Logs

1. Click on **frontend** service
2. Go to **"Logs"** tab
3. Look for:

**✅ Good signs:**
```
Ready on http://0.0.0.0:3000
Compiled successfully
```

**❌ Bad signs:**
```
Error: listen EADDRINUSE: address already in use :::3000
Error: Cannot find module
Build failed
```

### Step 3: Check Backend Status

Frontend waits for backend to be healthy. Check:

1. Go to **backend** service
2. Status should be: ✅ **Running & Healthy**
3. If backend is unhealthy:
   - Frontend won't start (it's waiting)
   - Fix backend first, then frontend will start

### Step 4: Verify Port Configuration

1. Frontend should listen on: `0.0.0.0:3000` (not `localhost:3000`)
2. Check logs for: `"Ready on http://0.0.0.0:3000"`
3. If you see `localhost`, that's the problem

### Step 5: Check Domain Configuration

1. Go to **Coolify** → **Destinations**
2. Find domain: `accountingsuites.bizabodeserver.org`
3. Verify:
   - ✅ **Service:** `frontend`
   - ✅ **Port:** `3000`
   - ✅ **Status:** Active
   - ✅ **HTTPS:** Enabled

## Common Causes & Fixes

### Cause 1: Frontend Container Crashed

**Check logs for errors:**
- Missing dependencies
- Build failed
- Port conflict
- Module not found

**Fix:**
1. Check logs for the actual error
2. Fix the error (usually missing env vars or build issue)
3. Rebuild/redeploy

### Cause 2: Frontend Waiting for Backend

**Symptoms:**
- Frontend shows "Starting" forever
- Backend is unhealthy

**Fix:**
1. Check backend logs
2. Fix backend issues (usually MongoDB connection)
3. Once backend is healthy, frontend will start

### Cause 3: Port Not Listening

**Symptoms:**
- Container is running but 502 error
- Logs don't show "Ready on http://0.0.0.0:3000"

**Fix:**
1. Verify `HOSTNAME=0.0.0.0` is set
2. Verify `PORT=3000` is set
3. Check start command: `npm start -- -H 0.0.0.0 -p 3000`

### Cause 4: Health Check Failing

**Symptoms:**
- Container running but marked "Unhealthy"
- Health check times out

**Fix:**
1. Health check needs 90 seconds to pass (Next.js takes time to start)
2. Verify health check command is correct
3. Check if Next.js is actually responding

### Cause 5: Build Failed

**Symptoms:**
- Container never starts
- Build logs show errors

**Fix:**
1. Check build logs
2. Common issues:
   - Missing `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_APP_URL`
   - TypeScript errors
   - Missing dependencies
3. Fix and rebuild

## Step-by-Step Fix

### Step 1: Check All Services

In Coolify, verify:
```
✅ MongoDB: Running & Healthy
✅ Redis: Running & Healthy
✅ Backend: Running & Healthy
✅ Frontend: Running & Healthy
```

### Step 2: Check Frontend Logs

Look for:
```
✅ Ready on http://0.0.0.0:3000
✅ Compiled successfully
```

If you see errors, note them.

### Step 3: Verify Environment Variables

Check these are set in Coolify:
```
NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org
BACKEND_URL=http://backend:3001
PORT=3000
HOSTNAME=0.0.0.0
```

### Step 4: Test Health Check

If you have shell access:
```bash
# Test if Next.js is responding
curl http://localhost:3000

# Should return HTML (200 OK)
```

### Step 5: Restart Services

1. Stop all services
2. Start in order:
   - MongoDB (wait for healthy)
   - Redis (wait for healthy)
   - Backend (wait for healthy)
   - Frontend (wait for healthy)

## Quick Commands (if you have shell access)

```bash
# Check if frontend container is running
docker ps | grep frontend

# Check frontend logs
docker logs <frontend-container-name>

# Test if port is listening
curl http://localhost:3000

# Check environment variables
docker exec <frontend-container> env | grep NEXT_PUBLIC
```

## Expected Behavior

When working correctly:
- ✅ Frontend logs show: `"Ready on http://0.0.0.0:3000"`
- ✅ Frontend status: "Running" and "Healthy"
- ✅ Domain loads the login page (not 502)
- ✅ Health check passes

## Still Not Working?

1. **Check Coolify Logs:**
   - Coolify → Your Resource → Logs
   - Look for Caddy/reverse proxy errors

2. **Verify Build Succeeded:**
   - Check if `.next` directory exists in container
   - Verify build completed without errors

3. **Check Network:**
   - All services on same network: `bizabode-network`
   - Frontend can reach backend: `http://backend:3001`

4. **Rebuild Everything:**
   - Stop all services
   - Clear build cache
   - Rebuild and restart

## Most Common Fix

**90% of 502 errors are because:**
1. Backend is unhealthy → Frontend won't start
2. Frontend build failed → Container crashes
3. Missing environment variables → Build/start fails

**Fix:**
1. Check backend first (must be healthy)
2. Check frontend logs for actual error
3. Set all required environment variables
4. Rebuild frontend

