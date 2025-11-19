# 🔧 502 Error - Domain Configuration Troubleshooting

## ❌ Still Getting 502 After Services Are Running

**All services are healthy, but domain still shows 502. This is a Coolify domain/proxy configuration issue.**

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Verify Frontend is Actually Running

**In Coolify → Docker Compose → Frontend Service:**

1. **Status should be:**
   - ✅ **Running** and **Healthy**
   - Not: Stopped, Crashed, or Unhealthy

2. **Logs should show:**
   ```
   ✓ Ready in 905ms
   ```

3. **Test directly in Terminal:**
   ```bash
   curl http://localhost:3000
   ```
   - ✅ Should return HTML (200 OK)
   - ❌ Connection refused = Frontend not running

---

### Step 2: Check Domain Configuration

**In Coolify → Your Docker Compose App:**

#### Option A: If Using "Domains" Section

1. Go to **Domains** tab/section
2. Find `accountingsuite.bizabodeserver.org`
3. **Verify:**
   - ✅ Service: **`frontend`** (NOT backend, NOT the app name)
   - ✅ Port: **`3000`** (NOT 3001)
   - ✅ HTTPS: Enabled
   - ✅ Status: Active

#### Option B: If Using "Destinations"

1. Go to Coolify → **Destinations**
2. Find `accountingsuite.bizabodeserver.org`
3. **Verify:**
   - ✅ Points to your **Docker Compose app**
   - ✅ Service: **`frontend`**
   - ✅ Port: **`3000`**
   - ✅ Path: `/` or empty
   - ✅ Status: Active

---

### Step 3: Check for Conflicting Domains

**In Coolify:**

1. Go through **ALL** applications
2. Check each app's **Domains** section
3. **Look for:** `accountingsuite.bizabodeserver.org`
4. **If found in multiple apps:**
   - Remove it from all except your Docker Compose app
   - Only ONE app should have this domain

---

### Step 4: Verify Service Names Match

**In Coolify Docker Compose:**

1. Check the **services list**
2. Find the frontend service
3. **Note the exact service name:**
   - Might be: `frontend`
   - Or: `frontend-vw84ck4wkscw8kgck40g08kc-...` (with hash)
   - Or: Your app name + `-frontend`

4. **In domain config, use the EXACT service name**

---

### Step 5: Check Port Mapping

**In Coolify → Frontend Service:**

1. Check **Ports** or **Exposed Ports** section
2. **Should show:**
   - Internal Port: `3000`
   - Or: `3000:3000` (host:container)

3. **If port mapping is wrong:**
   - Frontend might be on different port
   - Or port not exposed correctly

---

## 🎯 Common Issues & Fixes

### Issue 1: Domain Points to Backend

**Symptom:** Domain configured but pointing to wrong service

**Fix:**
1. Edit domain configuration
2. Change service from `backend` to `frontend`
3. Change port from `3001` to `3000`
4. Save and wait 1-2 minutes

### Issue 2: Domain Points to App Root Instead of Service

**Symptom:** Domain points to Docker Compose app but not specific service

**Fix:**
1. Coolify might route to first service or default
2. **Explicitly set service to `frontend`**
3. **Explicitly set port to `3000`**

### Issue 3: Multiple Domains Conflict

**Symptom:** Domain exists in multiple places

**Fix:**
1. Remove domain from all apps
2. Add it only to Docker Compose app
3. Configure it correctly (frontend:3000)
4. Redeploy

### Issue 4: Port Not Exposed

**Symptom:** Frontend running but port not accessible

**Fix:**
1. Check if frontend service exposes port 3000
2. In docker-compose, frontend should have `EXPOSE 3000` in Dockerfile
3. Coolify should auto-detect exposed ports
4. If not, manually configure port mapping

### Issue 5: Health Check Failing at Proxy Level

**Symptom:** Frontend is healthy but proxy thinks it's not

**Fix:**
1. Check Coolify proxy health check settings
2. Should check `/` (root path) not `/healthz`
3. Or disable health check for frontend
4. Frontend health check is internal (container level), not proxy level

---

## 🧪 Testing Steps

### Test 1: Frontend Direct Access

**In Coolify → Frontend Service → Terminal:**

```bash
curl http://localhost:3000
```

**Expected:** HTML response with Next.js content

**If fails:** Frontend not running or not listening on 3000

### Test 2: Check Service Ports

**In Coolify → Frontend Service:**

- Check what ports are exposed/mapped
- Should see port 3000

### Test 3: Check Domain Routing

**After configuring domain:**

1. Wait 2-3 minutes for proxy to update
2. Test domain: `https://accountingsuite.bizabodeserver.org`
3. Check browser DevTools → Network tab
4. See what URL it's trying to reach

---

## 🔧 Manual Fix Steps

### If Domain Configuration UI is Confusing:

1. **Remove domain completely**
   - Delete it from all apps
   - Wait 1 minute

2. **Add domain fresh**
   - Go to Docker Compose app
   - Add domain: `accountingsuite.bizabodeserver.org`
   - **Explicitly select:** `frontend` service
   - **Explicitly set:** Port `3000`
   - Enable HTTPS
   - Save

3. **Redeploy**
   - Redeploy Docker Compose app
   - Wait for all services to start

4. **Test**
   - Wait 2-3 minutes
   - Test domain in browser

---

## 📋 Verification Checklist

- [ ] Frontend service is Running and Healthy
- [ ] Frontend responds to `curl http://localhost:3000` in terminal
- [ ] Domain exists only on Docker Compose app (removed from others)
- [ ] Domain points to `frontend` service (not backend, not app root)
- [ ] Port is set to `3000` (not 3001, not empty)
- [ ] HTTPS/SSL is enabled
- [ ] Domain status is "Active"
- [ ] No conflicting domains in other apps
- [ ] Waited 2-3 minutes after configuration changes
- [ ] Cleared browser cache
- [ ] Tested in incognito/private window

---

## 🆘 Still Not Working?

If domain is correctly configured but still 502:

1. **Check Coolify version** - Some versions have different UI
2. **Check Coolify logs** - Look for proxy/routing errors
3. **Try accessing via IP** - If Coolify provides direct IP access
4. **Check SSL certificate** - Make sure Let's Encrypt cert is valid
5. **Contact Coolify support** - May be a Coolify-specific issue

---

## 💡 Alternative: Check Coolify Documentation

Different Coolify versions have different UIs:

- **Coolify v3:** Uses "Destinations" 
- **Coolify v4:** Uses "Domains" in app settings
- **Some versions:** Service selection in domain config
- **Some versions:** Port mapping in app settings

Check your Coolify version and its documentation for exact steps.

---

## ✅ What Should Work

After correct configuration:

- Domain: `accountingsuite.bizabodeserver.org`
- Routes to: `frontend` service
- Port: `3000`
- Result: Next.js app loads (no 502)

The containers are working - we just need Coolify's proxy to route correctly!

