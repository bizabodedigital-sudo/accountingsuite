# 🔧 Fixing Domain Configuration in Coolify

## ✅ Current Status

**All services are running correctly:**
- ✅ Mongo → up
- ✅ Redis → up  
- ✅ MinIO → up
- ✅ Worker → up
- ✅ Backend → running on port 3001
- ✅ Frontend → running on port 3000

**The 502 error is a domain/proxy configuration issue, not a service issue.**

---

## 🎯 The Problem

Your domain `accountingsuite.bizabodeserver.org` is likely pointing to:
- ❌ Wrong service (backend instead of frontend)
- ❌ Wrong port (3001 instead of 3000)
- ❌ Old/deleted service
- ❌ Not configured at all

---

## ✅ Step-by-Step Fix

### Step 1: Remove Domain from Old Apps

**In Coolify:**

1. Go through **all your Applications**
2. For each app that previously used `accountingsuite.bizabodeserver.org`:
   - Open the app
   - Go to **Domains** section
   - If you see `accountingsuite.bizabodeserver.org` → **Remove it**
   - Save/Redeploy if prompted

**Goal:** Domain should exist **only** on your Docker Compose app.

---

### Step 2: Configure Domain in Docker Compose App

**In Coolify → Your Docker Compose App:**

1. Go to **Domains** or **Networking** section
2. Click **Add Domain** or **Configure Domain**
3. Enter domain:
   ```
   accountingsuite.bizabodeserver.org
   ```
4. **Select Service:**
   - Choose **`frontend`** service (NOT backend)
5. **Set Port:**
   - Port: **`3000`** (NOT 3001)
6. **Enable HTTPS:**
   - Turn on **Let's Encrypt** / **HTTPS**
   - This will generate SSL certificate automatically
7. **Save**

---

### Step 3: Verify Configuration

**After saving, verify:**

- ✅ Domain: `accountingsuite.bizabodeserver.org`
- ✅ Service: `frontend`
- ✅ Port: `3000`
- ✅ HTTPS: Enabled
- ✅ Status: Active

---

### Step 4: Redeploy

**In the same Docker Compose app:**

1. Click **Redeploy**
2. Wait for services to start
3. Check logs to confirm:
   - Frontend: `✓ Ready in Xms`
   - Backend: `✅ Server running on port 3001`

---

### Step 5: Test Domain

**After redeploy:**

1. Open browser: `https://accountingsuite.bizabodeserver.org`
2. **Expected:**
   - ✅ Next.js app loads
   - ✅ No 502 error
   - ✅ Application works

**If still 502:**
- Wait 1-2 minutes for DNS/proxy to update
- Check domain configuration again
- Verify frontend service is running

---

## 🔍 Alternative: Check "Destinations" in Coolify

**Some Coolify versions use "Destinations" instead:**

1. Go to Coolify → **Destinations**
2. Find `accountingsuite.bizabodeserver.org`
3. Check:
   - **Service:** Should be `frontend` (or your Docker Compose app name)
   - **Port:** Should be `3000`
   - **Path:** Should be `/` or empty
   - **Status:** Should be **Active**

**If wrong:**
- Edit the destination
- Change service to `frontend`
- Change port to `3000`
- Save

---

## 🧪 Quick Verification

### Check Frontend Service Port

**In Coolify → Frontend Service:**

1. Check **Ports** section
2. Should show: **3000** (internal)
3. Or check **Exposed Ports**

### Test Frontend Directly

**In Coolify → Frontend Service → Terminal:**

```bash
curl http://localhost:3000
```

**Expected:**
- ✅ HTML response (200 OK)
- ✅ Next.js content

---

## ⚠️ Common Mistakes

### Mistake 1: Domain Points to Backend

**Symptom:** Domain works but shows API responses instead of frontend

**Fix:** Change service from `backend` to `frontend`, port from `3001` to `3000`

### Mistake 2: Domain Points to Wrong Port

**Symptom:** 502 error or wrong service responding

**Fix:** Verify port is `3000` (frontend), not `3001` (backend)

### Mistake 3: Multiple Apps Using Same Domain

**Symptom:** Unpredictable behavior, sometimes works sometimes doesn't

**Fix:** Remove domain from all apps except Docker Compose app

### Mistake 4: Domain Not Configured

**Symptom:** Domain doesn't resolve or shows default Coolify page

**Fix:** Add domain to Docker Compose app with correct service/port

---

## 📋 Checklist

- [ ] Removed domain from all old apps
- [ ] Domain exists only on Docker Compose app
- [ ] Domain points to `frontend` service
- [ ] Port is set to `3000`
- [ ] HTTPS/SSL is enabled
- [ ] Domain status is "Active"
- [ ] Docker Compose app redeployed
- [ ] Frontend service is running
- [ ] Tested domain in browser

---

## 🆘 Still Getting 502?

If domain is correctly configured but still getting 502:

1. **Wait 2-3 minutes** - DNS and proxy can take time to update
2. **Clear browser cache** - Old cached responses
3. **Check SSL certificate** - Make sure Let's Encrypt certificate is valid
4. **Verify frontend health** - Frontend should be "Healthy" in Coolify
5. **Check Coolify proxy logs** - If accessible, look for routing errors
6. **Test without HTTPS** - Try `http://accountingsuite.bizabodeserver.org` (should redirect to HTTPS)

---

## ✅ Success Indicators

After fixing:

- ✅ Domain loads Next.js app
- ✅ No 502 errors
- ✅ HTTPS works (green lock icon)
- ✅ Application functions correctly
- ✅ API calls work (frontend → backend)

---

## 📝 Notes

- **Domain configuration** is separate from Docker Compose services
- **Coolify's proxy** (Traefik) routes traffic based on domain configuration
- **Port 3000** = Frontend (Next.js)
- **Port 3001** = Backend (API)
- **Domain should point to frontend:3000** for user-facing traffic
- **Backend API** is accessed via `NEXT_PUBLIC_API_URL` from frontend, not directly via domain

