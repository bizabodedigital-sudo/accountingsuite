# 🔧 502 Bad Gateway - Proxy Can't Reach Frontend

## ❌ Error: `ERR_HTTP_RESPONSE_CODE_FAILURE 502 (Bad Gateway)`

**Meaning:** Coolify's Traefik proxy cannot reach your frontend service, even though:
- ✅ Domain configured correctly (`frontend:3000`)
- ✅ Services are running
- ✅ Frontend shows "Ready"

---

## 🔍 Immediate Diagnostic Steps

### Step 1: Verify Frontend is Actually Responding

**In Coolify → Frontend Service → Terminal:**

```bash
curl -v http://localhost:3000
```

**Expected:**
```
< HTTP/1.1 200 OK
< Content-Type: text/html
...HTML content...
```

**If this fails:**
- Frontend isn't actually listening on 3000
- Or frontend crashed after showing "Ready"
- Check frontend logs for errors

---

### Step 2: Check Frontend Health Check

**In Coolify → Frontend Service:**

- **Health Status:** Should be "Healthy"
- **If "Unhealthy":**
  - Health check is failing
  - Proxy won't route to unhealthy services
  - Check health check logs

**Health check command:**
```bash
node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Test this manually in terminal** to see if it passes.

---

### Step 3: Check Proxy-Level Health Check

**Some Coolify versions have proxy health checks:**

1. Go to domain configuration
2. Check if there's a **proxy health check** setting
3. Should check `/` (root path)
4. **NOT** `/healthz` (that's backend)
5. If wrong, fix it or disable proxy health check

---

### Step 4: Verify Port Exposure

**In Coolify → Frontend Service → Ports/Networking:**

- Port 3000 should be **exposed/mapped**
- Should show: `3000` or `3000:3000`
- If missing, add port mapping

---

### Step 5: Check Service Name Exact Match

**In Coolify Docker Compose:**

1. Check exact frontend service name
2. Might be: `frontend`, `frontend-xxx`, or `your-app-frontend`
3. **In domain config, use EXACT name**
4. Case-sensitive!

---

## 🎯 Common Causes & Fixes

### Cause 1: Frontend Health Check Failing

**Symptom:** Frontend shows "Ready" but health check fails

**Fix:**
1. Test health check manually in terminal
2. Check if frontend responds to root path `/`
3. Health check might be checking wrong path
4. Update health check or fix frontend response

### Cause 2: Port Not Exposed Correctly

**Symptom:** Frontend running but port not accessible

**Fix:**
1. Check port mapping in Coolify
2. Verify Dockerfile has `EXPOSE 3000`
3. Add port mapping if missing
4. Redeploy frontend

### Cause 3: Proxy Health Check Wrong

**Symptom:** Frontend healthy but proxy thinks it's not

**Fix:**
1. Check proxy health check settings
2. Should check `/` not `/healthz`
3. Or disable proxy health check
4. Frontend container health check is separate from proxy

### Cause 4: Service Name Mismatch

**Symptom:** Domain points to service but name doesn't match

**Fix:**
1. Check exact service name in Docker Compose
2. Use exact name in domain config
3. Case-sensitive!

### Cause 5: Network Isolation

**Symptom:** Services can't communicate

**Fix:**
1. Verify all services on same network (`bizabode-network`)
2. Check network configuration
3. Redeploy if network changed

---

## 🔧 Quick Fixes to Try

### Fix 1: Remove and Re-add Domain

1. **Delete** domain from Docker Compose app
2. Wait 2 minutes
3. **Add** domain fresh:
   - Service: `frontend` (exact name)
   - Port: `3000`
   - HTTPS: Enabled
4. Wait 3-5 minutes
5. Test domain

### Fix 2: Redeploy Frontend Service

1. **Stop** frontend service
2. **Start** frontend service
3. Wait for health check to pass
4. Test domain

### Fix 3: Redeploy Entire Stack

1. **Redeploy** Docker Compose app
2. Wait for all services to start
3. Verify frontend is healthy
4. Wait 3-5 minutes
5. Test domain

### Fix 4: Check Coolify Proxy Logs

**If accessible:**
1. Check Coolify proxy/Traefik logs
2. Look for routing errors
3. Look for connection refused errors
4. This will show why proxy can't reach frontend

---

## 🧪 Diagnostic Tests

### Test 1: Frontend Direct Access

```bash
curl -v http://localhost:3000
```

**Should return:** 200 OK with HTML

### Test 2: Health Check

```bash
node -e "require('http').get('http://localhost:3000', (r) => {console.log('Status:', r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Should return:** Status: 200 and exit code 0

### Test 3: Check Port

```bash
netstat -tlnp | grep 3000
```

**Should show:** Port 3000 listening

---

## 📋 Final Checklist

- [ ] `curl http://localhost:3000` works in frontend terminal
- [ ] Frontend health check passes manually
- [ ] Frontend service is "Healthy" in Coolify
- [ ] Port 3000 is exposed/mapped
- [ ] Service name matches exactly (case-sensitive)
- [ ] Proxy health check checks `/` not `/healthz`
- [ ] All services on same network
- [ ] Waited 3-5 minutes after changes
- [ ] Cleared browser cache
- [ ] SSL certificate is valid

---

## 🆘 Still Getting 502?

**Share these details:**

1. **Result of** `curl http://localhost:3000` in frontend terminal
2. **Frontend health status** (Healthy? Unhealthy?)
3. **Result of health check** test in terminal
4. **Port mapping** (is port 3000 exposed?)
5. **Exact service name** (from Docker Compose services list)
6. **Proxy logs** (if accessible in Coolify)

This will help identify why the proxy can't reach the frontend!

