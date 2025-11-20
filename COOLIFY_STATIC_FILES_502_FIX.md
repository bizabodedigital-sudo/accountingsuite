# 🔧 Fix 502 Errors on Static Files (Chunks & Favicon)

## ❌ Errors

```
GET https://accountingsuite.bizabodeserver.org/_next/static/chunks 404 (Not Found)
GET https://accountingsuite.bizabodeserver.org/favicon.ico 502 (Bad Gateway)
```

**Problem:** Frontend is not serving static files correctly, or the service is not running properly.

---

## 🔍 Root Causes

1. **Frontend service not running** - Container stopped or crashed
2. **Static files not built** - Build incomplete or files missing
3. **Proxy can't reach frontend** - Network/routing issue
4. **Frontend running in wrong mode** - Dev mode instead of production
5. **Missing favicon** - No favicon.ico in public directory

---

## ✅ Solution Steps

### Step 1: Check Frontend Service Status

**In Coolify → Frontend Service:**

1. **Check status:**
   - Should be "Running" (green)
   - If "Stopped" → Click "Start"
   - If "Unhealthy" → Check logs

2. **Check logs:**
   - Go to **Logs** tab
   - Should see: `✓ Ready in ...ms`
   - Look for errors or crashes

---

### Step 2: Verify Static Files Exist

**In Coolify → Frontend Service → Terminal:**

```bash
# Check if .next directory exists
ls -la .next/

# Check if static files exist
ls -la .next/static/

# Check if chunks exist
ls -la .next/static/chunks/ | head -10

# Check public directory
ls -la public/
```

**Expected:**
- `.next/` directory exists
- `.next/static/chunks/` has JavaScript files
- `public/` directory exists

---

### Step 3: Test Frontend Directly

**In Coolify → Frontend Service → Terminal:**

```bash
# Test if frontend is responding
curl http://localhost:3000

# Test static files
curl http://localhost:3000/_next/static/chunks/112f346e31f991df.js

# Test favicon (might 404, that's OK)
curl http://localhost:3000/favicon.ico
```

**Expected:**
- `curl http://localhost:3000` returns HTML
- Static chunks return JavaScript code (200 status)
- Favicon might 404 (we'll fix that)

---

### Step 4: Check Domain/Proxy Configuration

**In Coolify → Frontend Service → Settings:**

1. **Domain Configuration:**
   - Domain: `accountingsuite.bizabodeserver.org`
   - Port: `3000`
   - HTTPS: Enabled
   - Path: `/` (root)

2. **Verify proxy routing:**
   - All paths should route to frontend on port 3000
   - No conflicting routes

---

### Step 5: Rebuild Frontend (If Needed)

**If static files are missing:**

1. **In Coolify → Frontend Service → Builds:**
   - Click **Rebuild**
   - Wait for build to complete
   - Check build logs for errors

2. **Verify build output:**
   - Should see: `✓ Compiled successfully`
   - Should see: `.next` directory created
   - No build errors

---

### Step 6: Add Favicon (Optional but Recommended)

**Create `frontend/public/favicon.ico`:**

You can:
1. **Use a simple favicon** - Convert any image to .ico format
2. **Use Next.js default** - Next.js will generate one automatically
3. **Add to layout.tsx** - Use Next.js metadata API

**Quick fix - Add to `frontend/src/app/layout.tsx`:**

```typescript
export const metadata: Metadata = {
  title: 'Bizabode Accounting Suite',
  description: 'Modern invoicing & bookkeeping for Jamaican SMEs',
  icons: {
    icon: '/favicon.ico',
  },
}
```

---

## 🎯 Quick Fix Checklist

- [ ] Frontend service is "Running" (not stopped)
- [ ] Frontend logs show: `✓ Ready` or `Local: http://localhost:3000`
- [ ] Static files exist: `.next/static/chunks/` has files
- [ ] `curl http://localhost:3000` returns HTML (not connection refused)
- [ ] Domain configured correctly on frontend service
- [ ] Port is set to `3000`
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

### Fix 3: Check Production Mode

**In Coolify → Frontend Service → Settings:**

1. **Check Command:**
   - Should be: `npm start` or empty
   - Should NOT be: `npm run dev`

2. **Check Environment:**
   ```env
   NODE_ENV=production
   ```

3. **Rebuild if needed**

---

### Fix 4: Verify Static Files Were Copied

**In Coolify → Frontend Service → Terminal:**

```bash
# Check Dockerfile copied files correctly
ls -la .next/static/chunks/ | wc -l
# Should show multiple files (not 0)

# Check file permissions
ls -la .next/static/chunks/
# Files should be readable
```

**If files are missing:**
- Rebuild frontend
- Check Dockerfile is copying `.next` directory correctly
- Verify build completed successfully

---

### Fix 5: Add Favicon (Prevent 502)

**Option A: Create favicon.ico**

1. **Create or download a favicon.ico file**
2. **Place it in:** `frontend/public/favicon.ico`
3. **Commit and push**
4. **Rebuild frontend**

**Option B: Use Next.js Metadata (Recommended)**

**Update `frontend/src/app/layout.tsx`:**

```typescript
export const metadata: Metadata = {
  title: 'Bizabode Accounting Suite',
  description: 'Modern invoicing & bookkeeping for Jamaican SMEs',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
}
```

Then create `frontend/public/icon.svg` (simple SVG icon).

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

3. **Favicon loads (or 404, not 502):**
   - Favicon request should return 200 or 404 (not 502)
   - 404 is OK if favicon doesn't exist
   - 502 means service is down

4. **No console errors:**
   - Open browser DevTools → Console
   - No 502 errors or failed chunk loads

---

## ✅ Success Indicators

After fixing:

- ✅ Frontend service shows "Running" and "Healthy"
- ✅ Frontend logs show: `✓ Ready in ...ms`
- ✅ Visiting domain shows login page
- ✅ Browser Network tab shows all chunks loading (200 status)
- ✅ Favicon returns 200 or 404 (not 502)
- ✅ No 502 errors in browser console
- ✅ Application works normally

---

## 💡 Pro Tips

1. **502 on favicon is usually harmless** - But indicates service might be down
2. **404 on chunks directory is normal** - Browser tries directory first, then specific files
3. **Always check logs first** - Most issues are visible in logs
4. **Rebuild if unsure** - A fresh build often fixes issues
5. **Check health checks** - Unhealthy service = investigate logs

---

## 🔗 Related Issues

- **502 on all routes:** See `COOLIFY_502_FIX.md`
- **Frontend build failing:** See `COOLIFY_FRONTEND_BUILD_FIX.md`
- **Turbopack errors:** See `COOLIFY_TURBOPACK_DEV_MODE_FIX.md`
- **Static files 502:** See `COOLIFY_FRONTEND_502_STATIC_FILES.md`

