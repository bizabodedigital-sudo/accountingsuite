# 🔧 Fixing HTTP 502 Error in Coolify

## ❌ Error: HTTP ERROR 502

**Meaning:** Coolify's reverse proxy (Traefik/Nginx) cannot reach your backend service.

---

## 🔍 Step-by-Step Troubleshooting

### Step 1: Check Backend Service Status

1. **Go to Coolify** → Your Docker Compose resource
2. **Find the "backend" service** in the services list
3. **Check the status:**
   - ✅ **Running** → Go to Step 2
   - ❌ **Stopped/Crashed/Failed** → Backend isn't running, fix that first
   - ⏳ **Starting** → Wait for it to start

### Step 2: Check Backend Logs

1. **Click on the backend service**
2. **Go to "Logs" tab**
3. **Look for:**
   - ✅ `✅ Server running in production mode on port 3001`
   - ✅ `✅ Health check available at http://0.0.0.0:3001/healthz`
   - ❌ Any errors or crashes
   - ❌ `Missing required environment variables`

**If you see errors:**
- Fix the errors first (usually JWT_SECRET or database connection issues)
- Redeploy after fixing

### Step 3: Check Backend Health Check

1. **In Coolify**, go to backend service
2. **Check health check status:**
   - ✅ **Healthy** → Backend is responding
   - ❌ **Unhealthy** → Backend is running but health check is failing
   - ⏳ **Starting** → Health check hasn't passed yet (wait up to 2 minutes)

**If unhealthy:**
- Check logs for errors
- Verify `/healthz` endpoint is working
- Check if backend is listening on port 3001

### Step 4: Verify Domain Configuration

1. **Go to Coolify** → Your Project → **Destinations**
2. **Find your domain:** `accountingsuite.bizabodeserver.org`
3. **Check:**
   - ✅ **Service:** Should point to `backend` service (or your Docker Compose resource)
   - ✅ **Port:** Should be `3001` (backend port)
   - ✅ **Path:** Should be `/` or empty
   - ✅ **Status:** Should be "Active" or "Enabled"

**If wrong:**
- Update the destination to point to the correct service and port
- Save and wait for Coolify to update the reverse proxy

### Step 5: Check Service Port Exposure

In your `docker-compose.coolify.yml`, the backend should expose port 3001:

```yaml
backend:
  # ... other config ...
  # Port is exposed via EXPOSE in Dockerfile
```

**Verify:**
1. Check `backend/Dockerfile` has: `EXPOSE 3001`
2. Check backend service logs show it's listening on port 3001
3. In Coolify, verify the service is exposing port 3001

### Step 6: Test Backend Directly

1. **In Coolify**, go to backend service
2. **Open "Terminal" tab**
3. **Run:**
   ```bash
   curl http://localhost:3001/healthz
   ```
   
**Expected response:**
- ✅ `{"status":"ok"}` or similar → Backend is working
- ❌ Connection refused → Backend isn't listening on port 3001
- ❌ Timeout → Backend is stuck or not responding

---

## 🎯 Common Causes & Fixes

### Cause 1: Backend Not Running

**Symptoms:**
- Service shows as "Stopped" or "Crashed"
- Logs show errors or no logs at all

**Fix:**
1. Check logs for errors
2. Fix environment variables (especially JWT_SECRET)
3. Redeploy the service

### Cause 2: Backend Not Healthy

**Symptoms:**
- Service shows as "Running" but "Unhealthy"
- Health check is failing

**Fix:**
1. Check backend logs for errors
2. Verify `/healthz` endpoint exists and works
3. Check if backend is actually listening on port 3001
4. Wait for health check to pass (can take up to 2 minutes)

### Cause 3: Wrong Domain Configuration

**Symptoms:**
- Backend is running and healthy
- But domain still shows 502

**Fix:**
1. Go to Coolify → Destinations
2. Check domain points to correct service
3. Verify port is `3001`
4. Update if needed and wait for propagation

### Cause 4: Backend Listening on Wrong Port

**Symptoms:**
- Backend logs show different port
- Health check fails

**Fix:**
1. Check `PORT` environment variable is `3001`
2. Check backend is listening on `0.0.0.0:3001` (not `127.0.0.1`)
3. Verify Dockerfile exposes port 3001

### Cause 5: Network Issues

**Symptoms:**
- Backend is running but reverse proxy can't reach it
- Services are on different networks

**Fix:**
1. Verify all services are on `bizabode-network`
2. Check docker-compose network configuration
3. Redeploy if network configuration changed

---

## ✅ Quick Fix Checklist

- [ ] Backend service is "Running" (not stopped/crashed)
- [ ] Backend logs show "Server running on port 3001"
- [ ] Backend health check is "Healthy"
- [ ] Domain destination points to backend service
- [ ] Domain destination port is `3001`
- [ ] Backend responds to `curl http://localhost:3001/healthz` in terminal
- [ ] No errors in backend logs
- [ ] Environment variables are set correctly

---

## 🚀 Immediate Actions

1. **Check backend service status** in Coolify
2. **Check backend logs** for errors
3. **Verify domain configuration** points to backend:3001
4. **Test backend directly** via terminal: `curl http://localhost:3001/healthz`
5. **Redeploy** if you made any changes

---

## 🆘 Still Getting 502?

If backend is running and healthy but still getting 502:

1. **Wait 1-2 minutes** - Reverse proxy might need time to update
2. **Check Coolify reverse proxy logs** (if accessible)
3. **Try accessing backend directly** via Coolify's internal URL
4. **Verify SSL certificate** is valid (if using HTTPS)
5. **Check if domain DNS** is pointing to Coolify server

---

## 📝 Notes

- **502 errors** mean the reverse proxy can't reach your service
- **Backend must be running AND healthy** for domain to work
- **Port must match** between service and domain configuration
- **Health checks** can take up to 2 minutes to pass
- **Domain updates** can take a few minutes to propagate

