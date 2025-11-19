# ⚡ 502 Error - Quick Diagnostic Checklist

## 🎯 Immediate Checks (Do These First)

### 1. Is Backend Running?

**In Coolify:**
- Go to Docker Compose → Backend service
- Status should be: **✅ Running**
- If **❌ Stopped/Crashed** → Check logs and fix errors

### 2. Is Backend Healthy?

**In Coolify:**
- Backend service → Health check status
- Should be: **✅ Healthy**
- If **❌ Unhealthy** → Backend is running but not responding correctly

### 3. Check Backend Logs

**Look for these lines:**
```
✅ Server running in production mode on port 3001
✅ Health check available at http://0.0.0.0:3001/healthz
```

**If you see errors instead:**
- Fix the errors (usually JWT_SECRET or database issues)
- Redeploy after fixing

### 4. Domain Configuration

**In Coolify → Destinations:**
- Domain: `accountingsuite.bizabodeserver.org`
- Service: Should point to **backend** service
- Port: Should be **3001**
- Status: Should be **Active**

**If wrong:**
- Update destination to backend:3001
- Save and wait 1-2 minutes

---

## 🔧 Most Common Fixes

### Fix 1: Backend Not Running

**If backend is stopped/crashed:**

1. Check logs for errors
2. Most common: Missing `JWT_SECRET`
3. Set `JWT_SECRET` in Coolify Shared Variables
4. Redeploy backend service

### Fix 2: Backend Not Healthy

**If backend is running but unhealthy:**

1. Wait up to 2 minutes (health check can take time)
2. Check if `/healthz` endpoint works
3. Verify backend is listening on port 3001
4. Check for errors in logs

### Fix 3: Wrong Domain Config

**If backend is healthy but domain shows 502:**

1. Go to Coolify → Destinations
2. Find `accountingsuite.bizabodeserver.org`
3. Verify it points to **backend** service on port **3001**
4. Update if needed
5. Wait 1-2 minutes for propagation

---

## 🧪 Test Backend Directly

**In Coolify → Backend Service → Terminal:**

```bash
curl http://localhost:3001/healthz
```

**Expected:**
- ✅ `{"status":"ok"}` → Backend is working
- ❌ Connection refused → Backend not running/listening
- ❌ Timeout → Backend stuck

---

## ✅ Success Indicators

After fixing, you should see:

1. ✅ Backend service: **Running** and **Healthy**
2. ✅ Backend logs: "Server running on port 3001"
3. ✅ Domain: Works without 502 error
4. ✅ Health check: `curl http://localhost:3001/healthz` returns OK

---

## 🆘 Still Not Working?

1. **Check all services** are running (mongo, redis, backend)
2. **Verify network** - all services on same network
3. **Check Coolify reverse proxy** logs (if accessible)
4. **Try redeploying** the entire Docker Compose resource
5. **Wait 2-3 minutes** after making changes

---

## 📋 Quick Action Plan

1. ✅ Check backend status → Running?
2. ✅ Check backend health → Healthy?
3. ✅ Check backend logs → Any errors?
4. ✅ Check domain config → Points to backend:3001?
5. ✅ Test backend → `curl http://localhost:3001/healthz`
6. ✅ Fix issues found
7. ✅ Redeploy if needed
8. ✅ Wait 2 minutes
9. ✅ Test domain again

