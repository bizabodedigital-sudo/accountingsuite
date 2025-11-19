# ⚡ 502 Error - Quick Diagnostic Checklist

## 🎯 Services Are Running - Domain Config Issue

**All containers are healthy, so the 502 is a Coolify routing problem.**

---

## ✅ Quick Checks (Do These First)

### 1. Verify Frontend is Running

**In Coolify → Frontend Service:**
- Status: ✅ **Running** and **Healthy**
- Logs show: `✓ Ready in Xms`

**Test in Terminal:**
```bash
curl http://localhost:3000
```
Should return HTML (200 OK)

---

### 2. Check Domain Configuration

**Go to Coolify → Your Docker Compose App → Domains/Destinations:**

**Must be:**
- Domain: `accountingsuite.bizabodeserver.org`
- Service: **`frontend`** ← CRITICAL
- Port: **`3000`** ← CRITICAL
- HTTPS: Enabled
- Status: Active

**Common mistakes:**
- ❌ Service: `backend` (wrong!)
- ❌ Service: App name (wrong!)
- ❌ Port: `3001` (wrong!)
- ❌ Port: Empty/Default (wrong!)

---

### 3. Remove Domain from Other Apps

**Check ALL apps in Coolify:**
- Remove `accountingsuite.bizabodeserver.org` from any other apps
- Should exist ONLY on Docker Compose app

---

### 4. Check Service Name

**In Coolify Docker Compose:**
- What is the exact name of the frontend service?
- Might be: `frontend`, `frontend-xxx`, or `your-app-frontend`
- Use the EXACT name in domain config

---

## 🔧 If Still 502 After Above Checks

### Option 1: Recreate Domain Configuration

1. **Delete** domain from Docker Compose app
2. Wait 1 minute
3. **Add** domain fresh:
   - Service: `frontend`
   - Port: `3000`
   - HTTPS: Enabled
4. **Redeploy** Docker Compose app
5. Wait 2-3 minutes
6. Test domain

### Option 2: Check Coolify Version

Different Coolify versions have different UIs:
- **v3:** Uses "Destinations" menu
- **v4:** Uses "Domains" in app settings
- Check your version and use correct UI

### Option 3: Verify Port Exposure

**In Coolify → Frontend Service:**
- Check if port 3000 is exposed/mapped
- Should show: `3000` or `3000:3000`
- If missing, manually add port mapping

---

## 🧪 Test Commands

**In Coolify → Frontend Service → Terminal:**

```bash
# Test 1: Is frontend listening?
curl http://localhost:3000

# Test 2: Check what port it's on
netstat -tlnp | grep 3000

# Test 3: Check process
ps aux | grep next
```

---

## 📋 Final Checklist

- [ ] Frontend is Running and Healthy
- [ ] `curl http://localhost:3000` works in terminal
- [ ] Domain points to `frontend` service (not backend)
- [ ] Port is `3000` (not 3001)
- [ ] Domain removed from all other apps
- [ ] Domain status is "Active"
- [ ] HTTPS enabled
- [ ] Waited 2-3 minutes after changes
- [ ] Cleared browser cache
- [ ] Tested in incognito window

---

## 🆘 Need More Help?

**Share these details:**

1. **Coolify version** (check Settings → About)
2. **Domain config screenshot** (showing service and port)
3. **Frontend service name** (exact name from services list)
4. **Result of** `curl http://localhost:3000` in frontend terminal
5. **Any error messages** in Coolify proxy/logs

This will help identify the exact issue!
