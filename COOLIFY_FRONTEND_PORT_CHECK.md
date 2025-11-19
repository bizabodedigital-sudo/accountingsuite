# 🔧 Frontend Service Port Configuration Check

## ✅ Domain Points to Frontend - Verify Port

**Domain:** `accountingsuite.bizabodeserver.org` → **Service:** `frontend` ✅

**Now check the PORT configuration:**

---

## 🎯 Critical Check: Port Must Be 3000

**In Coolify → Domain Configuration:**

1. **Service:** `frontend` ✅ (you confirmed this)
2. **Port:** Must be **`3000`** ← CHECK THIS
3. **NOT:** `3001` (that's backend)
4. **NOT:** Empty or default

---

## 🔍 Verify Frontend Port

### Check 1: Frontend Service Ports

**In Coolify → Frontend Service → Ports/Networking:**

- Should show: **Port 3000** exposed
- Or: `3000:3000` mapping
- Or: Internal port `3000`

### Check 2: Test Frontend Directly

**In Coolify → Frontend Service → Terminal:**

```bash
curl http://localhost:3000
```

**Expected:**
- ✅ HTML response (200 OK)
- ✅ Next.js content

**If this fails:**
- Frontend might not be listening on 3000
- Or frontend crashed

### Check 3: Check Frontend Logs

**In Coolify → Frontend Service → Logs:**

**Should see:**
```
✓ Ready in 905ms
- Local:   http://localhost:3000
- Network: http://10.x.x.x:3000
```

**If you see different port:**
- Frontend might be on different port
- Update domain config to match

---

## 🔧 Common Port Issues

### Issue 1: Port Set to 3001 Instead of 3000

**Symptom:** Domain points to frontend but wrong port

**Fix:** Change port from `3001` to `3000` in domain config

### Issue 2: Port Not Set (Empty/Default)

**Symptom:** Domain points to frontend but no port specified

**Fix:** Explicitly set port to `3000`

### Issue 3: Port Mapping Missing

**Symptom:** Frontend running but port not exposed

**Fix:** 
- Check if port 3000 is exposed in frontend service
- May need to add port mapping in Coolify
- Or verify Dockerfile has `EXPOSE 3000`

---

## 📋 Quick Verification Steps

1. **Domain config:**
   - Service: `frontend` ✅
   - Port: **`3000`** ← Verify this!

2. **Frontend service:**
   - Status: Running and Healthy
   - Port 3000 exposed/mapped

3. **Test:**
   - `curl http://localhost:3000` works in terminal
   - Frontend logs show "Ready" on port 3000

4. **After fixing:**
   - Save domain config
   - Wait 2-3 minutes
   - Test domain in browser

---

## 🆘 If Port is Already 3000

If domain is correctly set to `frontend:3000` but still 502:

1. **Check frontend health** - Is it actually healthy?
2. **Check frontend logs** - Any errors?
3. **Test direct access** - Does `curl http://localhost:3000` work?
4. **Wait longer** - Proxy can take 3-5 minutes to update
5. **Clear browser cache** - Old cached responses
6. **Check SSL certificate** - Is Let's Encrypt cert valid?

---

## ✅ What Should Work

**Correct configuration:**
- Domain: `accountingsuite.bizabodeserver.org`
- Service: `frontend`
- Port: `3000`
- HTTPS: Enabled
- Frontend: Running and Healthy on port 3000

**Result:** Domain loads Next.js app (no 502)

