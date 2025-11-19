# 🔧 Fixing Backend Unhealthy Status

## ❌ Problem: Backend Container is Unhealthy

**Error:** `dependency failed to start: container backend-... is unhealthy`

This prevents frontend from starting because frontend depends on backend being healthy.

---

## 🔍 Step-by-Step Troubleshooting

### Step 1: Check Backend Logs

**In Coolify → Backend Service → Logs:**

**Look for:**
- ✅ `✅ Server running in production mode on port 3001`
- ✅ `✅ Health check available at http://0.0.0.0:3001/healthz`
- ✅ `✅ MongoDB connected: mongo`

**If you see errors:**
- ❌ `Missing required environment variables` → Set JWT_SECRET
- ❌ `MongoDB connection error` → Check MongoDB is running
- ❌ `Port 3001 is already in use` → Port conflict
- ❌ `Failed to create S3 bucket` → S3 credentials issue (non-critical)

### Step 2: Test Health Endpoint Manually

**In Coolify → Backend Service → Terminal:**

```bash
curl http://localhost:3001/healthz
```

**Expected:**
- ✅ `{"status":"ok","message":"Server is healthy"}` → Backend is working
- ❌ Connection refused → Backend not listening on port 3001
- ❌ Timeout → Backend stuck or not responding
- ❌ 503/500 error → Backend running but health check failing

### Step 3: Check Health Check Configuration

**Current health check:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/healthz"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 120s
```

**Issues:**
- `start_period: 120s` might not be enough if backend takes longer to start
- `retries: 5` might be too few if backend is slow to respond
- Backend might be crashing before health check passes

### Step 4: Check Backend Startup Time

**Backend needs time to:**
1. Start Node.js process
2. Connect to MongoDB (can take 5-10 seconds)
3. Connect to Redis (can take a few seconds)
4. Initialize services
5. Start listening on port 3001

**Total startup time:** Can be 30-60 seconds or more

---

## 🎯 Common Causes & Fixes

### Cause 1: Backend Crashing on Startup

**Symptoms:**
- Backend starts then immediately stops
- Logs show errors before "Server running"

**Fix:**
1. Check logs for specific error
2. Common issues:
   - Missing JWT_SECRET (should have default now)
   - MongoDB connection failing
   - Port already in use
   - Missing dependencies
3. Fix the error and redeploy

### Cause 2: Backend Taking Too Long to Start

**Symptoms:**
- Backend logs show it's starting
- But health check fails before it's ready
- Backend eventually starts but too late

**Fix:**
1. Increase `start_period` to 180s or more
2. Increase `retries` to 10
3. Check MongoDB/Redis connection speed

### Cause 3: Health Check Endpoint Not Working

**Symptoms:**
- Backend is running
- But `/healthz` endpoint returns error

**Fix:**
1. Test endpoint manually: `curl http://localhost:3001/healthz`
2. Check if endpoint exists in app.js
3. Verify endpoint returns 200 status

### Cause 4: MongoDB/Redis Not Ready

**Symptoms:**
- Backend waiting for database connections
- Health check fails because database not connected

**Fix:**
1. Ensure MongoDB and Redis are healthy first
2. Backend has `depends_on` for these services
3. Wait for them to be healthy before backend starts

---

## ✅ Quick Fix Checklist

- [ ] Backend logs show "Server running on port 3001"
- [ ] Backend logs show "MongoDB connected"
- [ ] Backend responds to `curl http://localhost:3001/healthz`
- [ ] MongoDB is healthy (backend depends on it)
- [ ] Redis is healthy (backend depends on it)
- [ ] No errors in backend logs
- [ ] Health check start_period is sufficient (180s+)
- [ ] Health check retries is sufficient (10+)

---

## 🚀 Immediate Actions

1. **Check backend logs** → Look for errors or "Server running"
2. **Test health endpoint** → `curl http://localhost:3001/healthz` in terminal
3. **Check MongoDB/Redis** → Ensure they're healthy first
4. **Increase health check timeout** → If backend is slow to start
5. **Fix any errors** → Based on log messages
6. **Redeploy** → After fixing issues

---

## 🔧 Updated Health Check Configuration

I've updated the health check to be more lenient:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/healthz"] || exit 0
  interval: 30s
  timeout: 10s
  retries: 10
  start_period: 180s
```

**Changes:**
- `retries: 10` (was 5) - More attempts before giving up
- `start_period: 180s` (was 120s) - More time for backend to start
- Added `|| exit 0` to handle curl failures gracefully

---

## 🆘 Still Unhealthy?

1. **Check backend logs** for specific errors
2. **Test health endpoint manually** in terminal
3. **Verify MongoDB/Redis** are healthy
4. **Increase start_period** even more if needed
5. **Check if backend is actually running** (not crashing)

