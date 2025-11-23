# Troubleshooting HTTP 503 Error

## What is a 503 Error?

**HTTP 503 Service Unavailable** means Coolify's reverse proxy (Caddy) cannot reach your frontend service.

## Quick Diagnostic Steps

### 1. Check Service Status in Coolify

1. Go to **Coolify** → Your Docker Compose Resource
2. Check the **"Services"** or **"Containers"** tab
3. Look for the **frontend** service status:
   - ✅ **Running** → Go to Step 2
   - ❌ **Stopped/Crashed** → Check logs (Step 3)
   - ⏳ **Starting** → Wait a few minutes
   - ⚠️ **Unhealthy** → Check health check (Step 4)

### 2. Check Frontend Logs

1. Click on the **frontend** service in Coolify
2. Go to **"Logs"** tab
3. Look for:
   - ✅ `"Ready on http://0.0.0.0:3000"` → Frontend is running
   - ❌ `"Error: listen EADDRINUSE"` → Port conflict
   - ❌ `"Cannot find module"` → Missing dependencies
   - ❌ `"Build failed"` → Build error

### 3. Check Backend Status

The frontend depends on the backend being healthy. Check:

1. Go to **backend** service in Coolify
2. Check status:
   - ✅ **Running & Healthy** → Backend is OK
   - ❌ **Unhealthy/Stopped** → Backend issue (fix this first)

**If backend is unhealthy:**
- Frontend won't start (it waits for backend)
- Check backend logs for errors
- Verify MongoDB is running and healthy

### 4. Check Health Checks

1. **Frontend Health Check:**
   - Should return HTTP 200 on port 3000
   - Check: `http://localhost:3000` (inside container)

2. **Backend Health Check:**
   - Should return HTTP 200 on `/healthz`
   - Check: `http://localhost:3001/healthz` (inside container)

### 5. Check Domain Configuration

1. Go to **Coolify** → Your Project → **Destinations**
2. Find domain: `accountingsuites.bizabodeserver.org`
3. Verify:
   - ✅ **Service:** Points to `frontend` service
   - ✅ **Port:** `3000`
   - ✅ **Status:** Active/Enabled
   - ✅ **HTTPS:** Enabled

## Common Causes & Fixes

### Cause 1: Frontend Container Not Running

**Symptoms:**
- Frontend service shows "Stopped" or "Crashed"
- No logs or error logs

**Fix:**
1. Check frontend logs for errors
2. Verify build succeeded
3. Check if dependencies are installed
4. Restart the service

### Cause 2: Frontend Waiting for Backend

**Symptoms:**
- Frontend shows "Starting" but never becomes "Running"
- Backend is unhealthy or stopped

**Fix:**
1. Check backend status first
2. Fix backend issues (MongoDB connection, etc.)
3. Once backend is healthy, frontend should start

### Cause 3: Build Failed

**Symptoms:**
- Frontend container never starts
- Build logs show errors

**Fix:**
1. Check build logs in Coolify
2. Common issues:
   - Missing environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`)
   - TypeScript errors
   - Missing dependencies
3. Fix build errors and redeploy

### Cause 4: Port/Network Issue

**Symptoms:**
- Frontend is running but 503 error persists
- Health check fails

**Fix:**
1. Verify frontend is listening on `0.0.0.0:3000` (not `localhost`)
2. Check network configuration in docker-compose.yml
3. Verify Coolify domain points to correct port

### Cause 5: Health Check Failing

**Symptoms:**
- Container is running but marked "Unhealthy"
- Health check times out

**Fix:**
1. Increase `start_period` in health check
2. Check if Next.js is actually responding
3. Verify health check command is correct

## Step-by-Step Fix

### Step 1: Check All Services

```bash
# In Coolify, verify:
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

If you see errors, fix them.

### Step 3: Test Health Check Manually

If you have shell access to the container:
```bash
# Test if Next.js is responding
curl http://localhost:3000

# Should return HTML (200 OK)
```

### Step 4: Verify Domain Routing

1. In Coolify → Destinations
2. Check domain configuration
3. Ensure it points to `frontend:3000`

### Step 5: Restart Services

1. Stop all services
2. Start in order:
   - MongoDB
   - Redis
   - Backend (wait for healthy)
   - Frontend (wait for healthy)

## Quick Commands (if you have shell access)

```bash
# Check if frontend container is running
docker ps | grep frontend

# Check frontend logs
docker logs <frontend-container-name>

# Test health check
curl http://localhost:3000

# Check if port is listening
netstat -tuln | grep 3000
```

## Still Not Working?

1. **Check Coolify Logs:**
   - Coolify → Your Resource → Logs
   - Look for Caddy/reverse proxy errors

2. **Verify Environment Variables:**
   - `NEXT_PUBLIC_API_URL` is set
   - `NEXT_PUBLIC_APP_URL` is set
   - `BACKEND_URL` is set to `http://backend:3001`

3. **Check Build Output:**
   - Verify `.next` directory exists
   - Check if build completed successfully

4. **Restart Everything:**
   - Stop all services
   - Clear volumes (if needed)
   - Rebuild and restart

## Expected Behavior

When everything is working:
- ✅ All services show "Running" and "Healthy"
- ✅ Frontend logs show: `"Ready on http://0.0.0.0:3000"`
- ✅ Domain loads the login page (not 503)
- ✅ Health checks pass

## Need More Help?

Check these files:
- `COOLIFY_DOCKER_COMPOSE_SETUP.md` - Deployment guide
- `COOLIFY_502_TROUBLESHOOTING.md` - Similar issues
- Service logs in Coolify UI

