# 🔧 Configure Backend API Routing in Coolify

## ❌ Current Issue

**Frontend is calling:** `POST https://accountingsuite.bizabodeserver.org/api/auth/login` → **404**

**Problem:** The domain `accountingsuite.bizabodeserver.org` only routes to the frontend service (port 3000). There's no routing for `/api/*` paths to reach the backend.

---

## ✅ Solution: Route `/api/*` to Backend

You need to configure Coolify to route API requests to the backend service.

---

## 🎯 Option 1: Configure Backend Domain/Path Routing (Recommended)

### In Coolify → Backend Service:

1. Go to **Backend Service** in your Docker Compose app
2. Go to **Domains** or **Networking** section
3. **Add domain/path routing:**
   - **Domain:** `accountingsuite.bizabodeserver.org`
   - **Path:** `/api/*` (or just `/api`)
   - **Service:** `backend`
   - **Port:** `3001`
   - **HTTPS:** Enabled

**This will route:**
- `accountingsuite.bizabodeserver.org/api/*` → Backend (port 3001)
- `accountingsuite.bizabodeserver.org/*` → Frontend (port 3000)

---

## 🎯 Option 2: Use API Subdomain

### Create separate API subdomain:

1. **Add domain to Backend Service:**
   - Domain: `api.accountingsuite.bizabodeserver.org`
   - Service: `backend`
   - Port: `3001`
   - HTTPS: Enabled

2. **Update Frontend Environment Variable:**
   - `NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org`
   - **Rebuild frontend** after changing

**This will route:**
- `api.accountingsuite.bizabodeserver.org/*` → Backend (port 3001)
- `accountingsuite.bizabodeserver.org/*` → Frontend (port 3000)

---

## 🎯 Option 3: Configure Path-Based Routing in Coolify

**If Coolify supports path-based routing:**

1. Go to **Domain Configuration** for `accountingsuite.bizabodeserver.org`
2. **Add path routing:**
   - Path: `/api/*`
   - Target Service: `backend`
   - Target Port: `3001`
3. **Keep root path (`/`) routing to frontend**

---

## 🔍 How to Check Current Routing

**In Coolify:**

1. Check **Backend Service** → **Domains** section
2. See if backend has any domain configured
3. If not, that's why `/api/*` requests return 404

---

## 📋 Step-by-Step: Configure Backend Routing

### Step 1: Add Domain to Backend Service

**In Coolify → Backend Service:**

1. Go to **Domains** or **Networking** tab
2. Click **Add Domain** or **Configure Domain**
3. Enter:
   - **Domain:** `accountingsuite.bizabodeserver.org`
   - **Path:** `/api` or `/api/*` (if Coolify supports paths)
   - **Port:** `3001`
   - **HTTPS:** Enabled
4. Save

### Step 2: Verify Both Services Have Domain

**Frontend Service:**
- Domain: `accountingsuite.bizabodeserver.org`
- Path: `/` (root)
- Port: `3000`

**Backend Service:**
- Domain: `accountingsuite.bizabodeserver.org`
- Path: `/api` or `/api/*`
- Port: `3001`

### Step 3: Redeploy

**After configuring:**

1. Redeploy Docker Compose app
2. Wait for services to start
3. Test API endpoint: `https://accountingsuite.bizabodeserver.org/api/healthz`
   - Should return: `{"status":"ok","message":"Server is healthy"}`

---

## 🧪 Testing

### Test 1: Backend Health Check

**In browser or curl:**
```bash
curl https://accountingsuite.bizabodeserver.org/api/healthz
```

**Expected:**
- ✅ Status: 200 OK
- ✅ Response: `{"status":"ok","message":"Server is healthy"}`

**If 404:**
- Backend routing not configured correctly
- Check domain/path configuration in Coolify

### Test 2: Login Endpoint

**In browser DevTools → Network:**
- Request: `POST https://accountingsuite.bizabodeserver.org/api/auth/login`
- **Expected:** 200 OK (or 401 if credentials wrong, but NOT 404)

**If 404:**
- Backend routing not working
- Check Coolify configuration

---

## ⚠️ Important Notes

### Path Priority

**If using same domain:**
- Coolify should route `/api/*` to backend first
- Then route `/*` to frontend
- Order matters - more specific paths first

### CORS Configuration

**If backend and frontend are on different domains:**
- Backend needs CORS configured to allow frontend domain
- Check `backend/src/app.js` for CORS settings

### Environment Variables

**After configuring routing:**
- `NEXT_PUBLIC_API_URL` should match the backend URL
- If using same domain: `https://accountingsuite.bizabodeserver.org`
- If using subdomain: `https://api.accountingsuite.bizabodeserver.org`
- **Rebuild frontend** if you change this

---

## 🆘 Troubleshooting

### Still Getting 404?

1. **Check backend service is running** - Should be "Healthy"
2. **Check backend logs** - Any errors?
3. **Test backend directly** - `curl http://localhost:3001/healthz` in backend terminal
4. **Check domain configuration** - Both services should have domain configured
5. **Check path routing** - `/api/*` should route to backend
6. **Wait 2-3 minutes** - Proxy updates can take time

### Backend Not Accessible?

1. **Check backend port** - Should be 3001
2. **Check backend health** - Should be "Healthy" in Coolify
3. **Check network** - Backend and frontend should be on same network
4. **Check firewall** - Port 3001 should be accessible

---

## ✅ Success Indicators

After configuring:

- ✅ `GET /api/healthz` → 200 OK
- ✅ `POST /api/auth/login` → 200 OK (or 401, not 404)
- ✅ Frontend can successfully call backend APIs
- ✅ No more 404 errors on API endpoints

---

## 📝 Summary

**The issue:** Backend is not accessible through the frontend domain.

**The fix:** Configure Coolify to route `/api/*` requests to the backend service on port 3001.

**Next steps:**
1. Add domain/path routing to backend service in Coolify
2. Redeploy
3. Test API endpoints
4. Login should work!

