# 🔧 Fix Frontend 502 Errors on Static Files

## ❌ Error

```
GET https://accountingsuite.bizabodeserver.org/_next/static/chunks/...js 
net::ERR_ABORTED 502 (Bad Gateway)
```

**Problem:** Frontend static files (Next.js chunks) are returning 502 errors, meaning the proxy can't reach the frontend service.

---

## 🔍 Root Causes

1. **Frontend service not running** - Container crashed or stopped
2. **Frontend not accessible on port 3000** - Port mismatch or network issue
3. **Proxy routing misconfigured** - Domain not pointing to frontend service
4. **Frontend build incomplete** - Static files not generated properly
5. **Health check failing** - Frontend marked as unhealthy

---

## ✅ Solution Steps

### Step 1: Check Frontend Service Status

**In Coolify → Frontend Service:**

1. **Check service status:**
   - Should be "Running" (green)
   - If "Stopped" or "Unhealthy" → Click "Start" or "Restart"

2. **Check logs:**
   - Go to **Logs** tab
   - Look for errors or crashes
   - Should see: `✓ Ready in ...ms` or `Local: http://localhost:3000`

3. **Check health:**
   - Should show "Healthy" status
   - If "Unhealthy" → Check health check configuration

---

### Step 2: Verify Frontend is Running

**In Coolify → Frontend Service → Terminal:**

```bash
# Check if process is running
ps aux | grep node

# Check if port 3000 is listening
netstat -tuln | grep 3000
# Or
ss -tuln | grep 3000

# Test local connection
curl http://localhost:3000
```

**Expected:**
- Node process running
- Port 3000 listening
- `curl` returns HTML (not connection refused)

---

### Step 3: Check Domain Configuration

**In Coolify → Frontend Service → Settings:**

1. **Domain Configuration:**
   - Domain: `accountingsuite.bizabodeserver.org`
   - Port: `3000`
   - HTTPS: Enabled
   - Path: `/` (root)

2. **Verify domain is ONLY on frontend:**
   - Go to **Backend Service** → Settings
   - Make sure `accountingsuite.bizabodeserver.org` is **NOT** configured there
   - Domain should only be on frontend service

3. **Check proxy routing:**
   - All paths (`/*`) should route to frontend on port 3000
   - No conflicting routes

---

### Step 4: Check Static Files in Container

**In Coolify → Frontend Service → Terminal:**

```bash
# Check if .next directory exists
ls -la .next/

# Check if static files exist
ls -la .next/static/

# Check if chunks exist
ls -la .next/static/chunks/ | head -10

# Check file permissions
ls -la .next/static/chunks/
```

**Expected:**
- `.next/` directory exists
- `.next/static/` directory exists
- `.next/static/chunks/` has JavaScript files
- Files are readable (not permission denied)

---

### Step 5: Rebuild Frontend (If Needed)

**If static files are missing or corrupted:**

1. **In Coolify → Frontend Service:**

2. **Rebuild:**
   - Go to **Builds** tab
   - Click **Rebuild** or **Redeploy**
   - Watch build logs for errors

3. **Check build output:**
   - Should see: `✓ Compiled successfully`
   - Should see: `.next` directory created
   - No build errors

---

### Step 6: Check Network Connectivity

**In Coolify → Frontend Service → Terminal:**

```bash
# Test if frontend can reach backend
curl http://backend:3001/healthz

# Check DNS resolution
nslookup backend
nslookup mongo
```

**Expected:**
- Can reach backend (if needed)
- DNS resolution works

---

## 🎯 Quick Fix Checklist

- [ ] Frontend service is "Running" (not stopped)
- [ ] Frontend logs show: `✓ Ready` or `Local: http://localhost:3000`
- [ ] Domain `accountingsuite.bizabodeserver.org` is configured on frontend service
- [ ] Domain is **NOT** configured on backend service
- [ ] Port is set to `3000` in frontend service
- [ ] HTTPS is enabled
- [ ] Static files exist: `.next/static/chunks/` has files
- [ ] Frontend health check is passing
- [ ] No errors in frontend logs

---

## 🔧 Common Fixes

### Fix 1: Restart Frontend Service

**In Coolify:**
1. Go to Frontend Service
2. Click **Stop**
3. Wait 10 seconds
4. Click **Start**
5. Wait for health check to pass

---

### Fix 2: Rebuild Frontend

**In Coolify:**
1. Go to Frontend Service → **Builds**
2. Click **Rebuild**
3. Wait for build to complete
4. Service should auto-start

---

### Fix 3: Check Domain Configuration

**In Coolify → Frontend Service → Settings:**

**Correct Configuration:**
- Domain: `accountingsuite.bizabodeserver.org`
- Port: `3000`
- Path: `/` (empty or `/`)
- HTTPS: ✅ Enabled

**In Coolify → Backend Service → Settings:**

**Make sure domain is NOT here:**
- Domain should be different (e.g., `api.accountingsuite.bizabodeserver.org`)
- Or no domain configured (backend accessed via internal network)

---

### Fix 4: Verify Static Files Were Built

**In Coolify → Frontend Service → Terminal:**

```bash
# Check build output
ls -la .next/static/chunks/ | wc -l
# Should show multiple files (not 0)

# Check a specific chunk file
cat .next/static/chunks/112f346e31f991df.js | head -5
# Should show JavaScript code (not empty or error)
```

**If files are missing:**
- Rebuild frontend
- Check build logs for errors
- Verify `npm run build` completed successfully

---

### Fix 5: Check File Permissions

**In Coolify → Frontend Service → Terminal:**

```bash
# Check permissions
ls -la .next/static/chunks/

# Fix permissions if needed (run as root first)
# In Coolify, you might need to rebuild with correct user
```

**Expected permissions:**
- Files readable by the `nextjs` user (or user running the app)
- No permission denied errors

---

## 🆘 Still Getting 502?

### Debug Steps:

1. **Check frontend logs:**
   ```bash
   # In Coolify → Frontend Service → Logs
   # Look for errors, crashes, or connection issues
   ```

2. **Test frontend directly:**
   ```bash
   # In Coolify → Frontend Service → Terminal
   curl http://localhost:3000
   # Should return HTML, not connection refused
   ```

3. **Check proxy logs:**
   - In Coolify, check Traefik/proxy logs
   - Look for routing errors or connection failures

4. **Verify network:**
   - Frontend and backend should be on same network
   - Check if services can communicate

5. **Check resource limits:**
   - Frontend might be out of memory
   - Check CPU/memory usage in Coolify

---

## 📋 Verification

**After fixing, verify:**

1. **Frontend loads:**
   - Visit: `https://accountingsuite.bizabodeserver.org`
   - Should see login page (not 502 error)

2. **Static files load:**
   - Open browser DevTools → Network tab
   - Refresh page
   - All `_next/static/chunks/*.js` files should return 200 (not 502)

3. **No console errors:**
   - Open browser DevTools → Console
   - No 502 errors or failed chunk loads

---

## ✅ Success Indicators

After fixing:

- ✅ Frontend service shows "Running" and "Healthy"
- ✅ Frontend logs show: `✓ Ready in ...ms`
- ✅ Visiting domain shows login page
- ✅ Browser Network tab shows all chunks loading (200 status)
- ✅ No 502 errors in browser console
- ✅ Application works normally

---

## 💡 Pro Tips

1. **Always check logs first** - Most issues are visible in logs
2. **Rebuild if unsure** - A fresh build often fixes issues
3. **Check domain configuration** - Make sure domain is only on frontend
4. **Verify static files exist** - Missing files = rebuild needed
5. **Monitor health checks** - Unhealthy service = investigate logs

---

## 🔗 Related Issues

- **502 on all routes:** See `COOLIFY_502_FIX.md`
- **Frontend build failing:** See `COOLIFY_FRONTEND_BUILD_FIX.md`
- **Domain routing issues:** See `COOLIFY_502_DOMAIN_TROUBLESHOOT.md`

