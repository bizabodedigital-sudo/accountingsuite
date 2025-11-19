# 🔧 Fixing Frontend 502 Error

## ❌ Error: HTTP ERROR 502 on Frontend Domain

**Meaning:** Coolify's reverse proxy cannot reach your frontend service.

---

## 🔍 Step-by-Step Troubleshooting

### Step 1: Check Frontend Service Status

**In Coolify:**
1. Go to your Docker Compose resource
2. Find the **"frontend"** service
3. Check status:
   - ✅ **Running** → Go to Step 2
   - ❌ **Stopped/Crashed/Failed** → Check logs and fix errors
   - ⏳ **Starting** → Wait for it to start

### Step 2: Check Frontend Logs

**Look for:**
```
✓ Ready in 856ms
```

**If you see errors instead:**
- Fix the errors first
- Common issues:
  - Build failed
  - Port conflicts
  - Missing dependencies

### Step 3: Check Frontend Health Check

**In Coolify:**
- Frontend service → Health check status
- Should be: **✅ Healthy**
- If **❌ Unhealthy**:
  - Frontend is running but health check is failing
  - Wait up to 90 seconds (start_period)
  - Check if port 3000 is accessible

### Step 4: Verify Domain Configuration

**In Coolify → Destinations:**
1. Find domain: `accountingsuite.bizabodeserver.org`
2. Check:
   - ✅ **Service:** Should point to **frontend** service
   - ✅ **Port:** Should be **3000**
   - ✅ **Path:** Should be `/` or empty
   - ✅ **Status:** Should be **Active**

**If wrong:**
- Update destination to point to frontend:3000
- Save and wait 1-2 minutes

### Step 5: Test Frontend Directly

**In Coolify → Frontend Service → Terminal:**

```bash
curl http://localhost:3000
```

**Expected:**
- ✅ HTML response → Frontend is working
- ❌ Connection refused → Frontend not listening on port 3000
- ❌ Timeout → Frontend stuck or not responding

---

## 🎯 Common Causes & Fixes

### Cause 1: Frontend Not Running

**Symptoms:**
- Service shows as "Stopped" or "Crashed"
- No logs or error logs

**Fix:**
1. Check logs for errors
2. Common issues:
   - Build failed (check build logs)
   - Missing environment variables
   - Port already in use
3. Fix errors and redeploy

### Cause 2: Frontend Not Healthy

**Symptoms:**
- Service shows as "Running" but "Unhealthy"
- Health check failing

**Fix:**
1. Wait up to 90 seconds (health check start_period)
2. Check if frontend responds on port 3000
3. Verify health check command is correct
4. Check for errors in logs

### Cause 3: Wrong Domain Configuration

**Symptoms:**
- Frontend is running and healthy
- But domain still shows 502

**Fix:**
1. Go to Coolify → Destinations
2. Find `accountingsuite.bizabodeserver.org`
3. Verify it points to **frontend** service on port **3000**
4. Update if needed
5. Wait 1-2 minutes for propagation

### Cause 4: Port Mismatch

**Symptoms:**
- Frontend logs show port 3000
- But domain points to different port

**Fix:**
1. Verify frontend exposes port 3000 (check Dockerfile)
2. Verify domain destination port is 3000
3. Update if needed

### Cause 5: Frontend Waiting for Backend

**Symptoms:**
- Frontend service shows "Starting" but never becomes healthy
- Logs show it's waiting

**Fix:**
1. Check backend is running and healthy first
2. Frontend has `depends_on: backend: condition: service_healthy`
3. If backend isn't healthy, frontend won't start
4. Fix backend first, then frontend will start

---

## ✅ Quick Fix Checklist

- [ ] Frontend service is "Running" (not stopped/crashed)
- [ ] Frontend logs show "✓ Ready in Xms"
- [ ] Frontend health check is "Healthy"
- [ ] Domain destination points to frontend service
- [ ] Domain destination port is 3000
- [ ] Frontend responds to `curl http://localhost:3000` in terminal
- [ ] No errors in frontend logs
- [ ] Backend is running and healthy (frontend depends on it)

---

## 🚀 Immediate Actions

1. **Check frontend status** in Coolify → Docker Compose → frontend service
2. **Check frontend logs** for errors or "Ready" message
3. **Verify domain config** → Destinations → accountingsuite.bizabodeserver.org
4. **Test frontend directly** → Terminal → `curl http://localhost:3000`
5. **Check backend status** → Frontend depends on backend being healthy
6. **Redeploy if needed** → After fixing issues

---

## 🆘 Still Getting 502?

If frontend is running and healthy but still getting 502:

1. **Wait 1-2 minutes** - Reverse proxy might need time to update
2. **Check Coolify reverse proxy logs** (if accessible)
3. **Try accessing frontend directly** via Coolify's internal URL
4. **Verify SSL certificate** is valid (if using HTTPS)
5. **Check if domain DNS** is pointing to Coolify server
6. **Clear browser cache** - Old cached responses might cause issues

---

## 📝 Notes

- **502 errors** mean the reverse proxy can't reach your service
- **Frontend must be running AND healthy** for domain to work
- **Port must match** between service and domain configuration
- **Health checks** can take up to 90 seconds to pass
- **Domain updates** can take a few minutes to propagate
- **Frontend depends on backend** - backend must be healthy first

