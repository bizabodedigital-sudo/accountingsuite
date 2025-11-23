# Diagnose 502 Error - Step by Step

## What to Check RIGHT NOW

### 1. Check Frontend Service Status in Coolify

**Go to:** Coolify → Your Docker Compose Resource → Services

**Check frontend service:**
- ✅ **Running** → Go to Step 2
- ❌ **Stopped/Crashed** → Check logs (Step 3)
- ⏳ **Starting** → Wait 2-3 minutes, then check again
- ⚠️ **Unhealthy** → Check health check (Step 4)

### 2. Check Frontend Logs

**Go to:** Frontend Service → Logs Tab

**Look for:**
```
✅ "Ready on http://0.0.0.0:3000"
✅ "Compiled successfully"
```

**If you see errors:**
- Note the exact error message
- Common errors:
  - `Error: listen EADDRINUSE` → Port conflict
  - `Cannot find module` → Missing dependencies
  - `Build failed` → Build error

### 3. Check Backend Status

**Frontend waits for backend to be healthy!**

**Check backend service:**
- ✅ **Running & Healthy** → Backend is OK
- ❌ **Unhealthy/Stopped** → **THIS IS THE PROBLEM**

**If backend is unhealthy:**
1. Check backend logs
2. Fix backend issues first
3. Once backend is healthy, frontend will start

### 4. Check Build Status

**Go to:** Frontend Service → Builds Tab

**Check latest build:**
- ✅ **Success** → Build worked
- ❌ **Failed** → Build error (check build logs)

**Common build errors:**
- Missing `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_APP_URL`
- TypeScript errors
- Missing dependencies

### 5. Verify Environment Variables

**In Coolify → Environment Variables, check:**
```
✅ JWT_SECRET is set
✅ NEXT_PUBLIC_API_URL is set
✅ NEXT_PUBLIC_APP_URL is set
✅ FRONTEND_URL is set
```

**In Coolify → Frontend Service → Build Arguments:**
```
✅ NEXT_PUBLIC_API_URL is set
✅ NEXT_PUBLIC_APP_URL is set
```

## Most Common Causes

### Cause 1: Backend is Unhealthy (90% of cases)

**Frontend won't start until backend is healthy!**

**Fix:**
1. Check backend logs
2. Fix backend issues (usually MongoDB connection or JWT_SECRET)
3. Wait for backend to be healthy
4. Frontend will then start automatically

### Cause 2: Frontend Build Failed

**Container crashes on start because build failed.**

**Fix:**
1. Check build logs
2. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` as build arguments
3. Rebuild frontend

### Cause 3: Frontend Container Crashed

**Container starts but immediately crashes.**

**Fix:**
1. Check frontend logs for crash reason
2. Usually: missing dependencies, port conflict, or build issue

## Quick Diagnostic Commands

**If you have shell access to the container:**

```bash
# Check if frontend is running
docker ps | grep frontend

# Check frontend logs
docker logs <frontend-container-name>

# Test if port is listening
curl http://localhost:3000

# Check environment variables
docker exec <frontend-container> env | grep NEXT_PUBLIC
```

## What to Tell Me

To help diagnose, please share:

1. **Frontend service status** (Running/Stopped/Unhealthy)
2. **Frontend logs** (last 20-30 lines)
3. **Backend service status** (Running/Stopped/Unhealthy)
4. **Build status** (Success/Failed)
5. **Any error messages** you see

With this info, I can pinpoint the exact issue!

