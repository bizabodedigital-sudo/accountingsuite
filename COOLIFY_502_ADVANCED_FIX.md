# 🔧 502 Error - Advanced Troubleshooting

## ❌ Still Getting 502 After Configuring Correctly

**Domain is on frontend:3000, but still 502. Let's dig deeper.**

---

## 🔍 Advanced Diagnostic Steps

### Step 1: Verify Frontend is Actually Responding

**In Coolify → Frontend Service → Terminal:**

```bash
curl -v http://localhost:3000
```

**Expected:**
```
< HTTP/1.1 200 OK
< Content-Type: text/html; charset=utf-8
...HTML content...
```

**If this FAILS:**
- Frontend isn't actually listening
- Check frontend logs for errors
- Frontend might have crashed after showing "Ready"

**If this WORKS:**
- Frontend is fine, it's a proxy/routing issue
- Continue to next steps

---

### Step 2: Test Backend Routing (Sanity Check)

**Temporarily test if proxy works at all:**

1. **Move** domain to **backend** service
2. Set backend internal port to **`3001`**
3. Redeploy
4. Visit: `https://accountingsuite.bizabodeserver.org/healthz`

**Expected:**
- ✅ See JSON: `{"status":"ok","message":"Server is healthy"}`
- ✅ This confirms DNS, Traefik, SSL certs all work

**If backend routing works:**
- Proxy is fine, issue is frontend-specific routing
- Move domain back to frontend:3000
- Continue troubleshooting frontend routing

**If backend routing also fails:**
- Proxy/routing issue at Coolify level
- Check Coolify proxy logs
- May need to check Coolify configuration

---

### Step 3: Check Exact Service Name

**In Coolify Docker Compose:**

1. Check **exact** frontend service name
2. Might be:
   - `frontend`
   - `frontend-vw84ck4wkscw8kgck40g08kc-...` (with hash)
   - `your-app-name-frontend`
   - Case-sensitive!

3. **In domain config, use EXACT name**
4. Try both short name (`frontend`) and full name if different

---

### Step 4: Check Port Exposure/Mapping

**In Coolify → Frontend Service:**

1. Check **Ports** section
2. Should show port **3000** exposed
3. If missing:
   - Add port mapping manually
   - Or check if Dockerfile exposes port correctly

**Verify Dockerfile:**
- Should have: `EXPOSE 3000`
- Check `frontend/Dockerfile` has this line

---

### Step 5: Check Proxy Health Check

**In Coolify → Domain Configuration:**

1. Look for **proxy-level health check** settings
2. Should be:
   - **Disabled**, OR
   - Path: `/`
   - Status: 200
   - Interval: reasonable (30s+)

3. **NOT:**
   - Path: `/healthz` (that's backend)
   - Path: `/api/health` (doesn't exist on frontend)
   - Too frequent checks (might mark as unhealthy)

---

### Step 6: Check Network Configuration

**In Coolify Docker Compose:**

1. Verify all services on same network
2. Check network name: `bizabode-network`
3. Frontend and proxy should be able to communicate

---

### Step 7: Check Coolify Version & UI Differences

**Different Coolify versions have different UIs:**

- **v3:** Uses "Destinations" menu, service selection different
- **v4:** Uses "Domains" in app, different routing
- **Check your version:** Settings → About

**Some versions need:**
- Explicit port mapping in app settings
- Service selection in domain config
- Network configuration

---

## 🔧 Advanced Fixes to Try

### Fix 1: Explicit Port Mapping

**In Coolify → Frontend Service:**

1. Go to **Ports/Networking**
2. **Manually add:**
   - Internal Port: `3000`
   - External Port: `3000` (or leave empty)
   - Protocol: `http`
   - Expose: Yes

### Fix 2: Remove and Re-add Domain Fresh

1. **Delete** domain completely from Docker Compose app
2. Wait 3 minutes
3. **Add** domain fresh:
   - Go to **Frontend service** (not app root)
   - Add domain: `accountingsuite.bizabodeserver.org`
   - Port: `3000`
   - HTTPS: Enabled
4. Wait 5 minutes
5. Test

### Fix 3: Check Service Labels/Tags

**Some Coolify versions use labels:**

- Check if frontend service needs specific labels
- Check Coolify documentation for Docker Compose routing
- May need to add labels to docker-compose.yml

### Fix 4: Try Different Port Temporarily

**Test if port is the issue:**

1. Change frontend to use port `8080` temporarily
2. Update domain to port `8080`
3. Redeploy
4. Test

**If works:** Port 3000 might be blocked or conflicting
**If still fails:** Not a port issue

---

## 🧪 Diagnostic Commands

### Test 1: Frontend Response

```bash
curl -v http://localhost:3000
```

### Test 2: Health Check

```bash
node -e "require('http').get('http://localhost:3000', (r) => {console.log('Status:', r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### Test 3: Port Listening

```bash
netstat -tlnp | grep 3000
# or
ss -tlnp | grep 3000
```

### Test 4: Process Check

```bash
ps aux | grep next
```

---

## 📋 Complete Checklist

- [ ] `curl http://localhost:3000` works in frontend terminal
- [ ] Frontend health check passes manually
- [ ] Backend routing test works (sanity check)
- [ ] Domain on frontend service (exact name)
- [ ] Port 3000 exposed/mapped
- [ ] Proxy health check disabled or correct
- [ ] Network configuration correct
- [ ] Removed and re-added domain fresh
- [ ] Waited 5+ minutes after changes
- [ ] Cleared browser cache
- [ ] Tested in incognito
- [ ] SSL certificate valid

---

## 🆘 Need More Info

**Share these details:**

1. **Result of** `curl http://localhost:3000` in frontend terminal
2. **Result of** backend routing test (`/healthz` via domain)
3. **Exact frontend service name** (from Docker Compose)
4. **Screenshot** of frontend service port/network config
5. **Screenshot** of domain configuration
6. **Coolify version** (Settings → About)
7. **Any errors** in Coolify proxy/logs

This will help identify the exact routing issue!

