# 🔧 Exact Fix for 502 Error - Step-by-Step

## ✅ Problem Identified

**All containers are running, but Coolify's proxy can't reach frontend on the correct port.**

---

## 🎯 Step-by-Step Fix

### Step 1: Attach Domain to Frontend Service (Not Backend)

**In Coolify:**

1. Open your **Docker Compose app**
2. Go to **Services/Containers** list
3. Click on **`frontend`** service (NOT backend, NOT app root)

**In Frontend Service:**

4. Find **Domains / URLs / Routing** section
5. **Add/Verify** domain: `accountingsuite.bizabodeserver.org`
6. **Make sure it's attached HERE**, not to backend or app root

**Then:**

7. Go to **backend** service
8. **Remove** `accountingsuite.bizabodeserver.org` if it exists there
9. Check **all other apps** in Coolify
10. **Remove** domain from anywhere else

**✅ Goal:** Only ONE router should claim this domain → the **frontend** service.

---

### Step 2: Set Correct Internal Port (3000)

**Still in Frontend Service:**

1. Go to **Port / Networking** section
2. Find **Internal port / Container port** field
3. **Set to:** `3000` ← CRITICAL

**Configuration:**
- **Internal/Container port:** `3000` (NOT 80, NOT empty)
- **Scheme:** `http` (Coolify handles HTTPS at edge)
- **Expose publicly:** Enabled/ON

**❌ Common mistake:** Port set to `80` or blank → Traefik tries `:80` → nothing listening → 502

---

### Step 3: Fix/Remove Frontend Health Check

**In Frontend Service:**

1. Check **Health Check** settings
2. **Either:**
   - **Disable** health check, OR
   - Set to check `/` path with status 200

**❌ Wrong health checks:**
- `/healthz` (that's backend)
- Non-existent paths
- Wrong status codes

**✅ Correct:**
- Disabled, OR
- Path: `/`, Status: 200

**Why:** Bad health check → Coolify marks frontend unhealthy → Traefik gives 502 even though Next.js is running.

---

### Step 4: Redeploy Docker Compose App

**After making changes:**

1. Go back to **Docker Compose app main page**
2. Click **Redeploy** or **Rebuild & Redeploy**
3. Wait for all services to be **Running/Healthy**
4. Test: `https://accountingsuite.bizabodeserver.org`

**Should now work!** ✅

---

## 🧪 Sanity Test (If Still 502)

**Temporarily test backend to verify proxy works:**

1. **Move** domain to **backend** service
2. Set backend internal port to **`3001`**
3. Redeploy
4. Visit: `https://accountingsuite.bizabodeserver.org/healthz`

**Expected:**
- ✅ See JSON response from backend health check
- ✅ This confirms DNS, Traefik, and SSL certs work

**Then:**
5. **Move** domain back to **frontend:3000**
6. **Redeploy** again
7. Test domain

---

## 📋 Checklist

- [ ] Domain attached to **frontend** service (not backend, not app root)
- [ ] Domain removed from backend service
- [ ] Domain removed from all other apps
- [ ] Frontend internal port set to **`3000`** (not 80, not empty)
- [ ] Frontend scheme set to **`http`**
- [ ] Frontend expose/public enabled
- [ ] Frontend health check disabled OR set to `/` with status 200
- [ ] Docker Compose app redeployed
- [ ] All services Running/Healthy
- [ ] Tested domain in browser

---

## 🆘 Still Not Working?

**Share these details:**

1. **Screenshot** of frontend service config showing:
   - Domain(s)
   - Internal/container port
   - Expose/public toggle
   - Health check settings

2. **Result of** `curl http://localhost:3000` in frontend terminal

3. **Frontend service status** (Running? Healthy?)

---

## ✅ Success Indicators

After fixing:

- ✅ Domain loads Next.js app
- ✅ No 502 errors
- ✅ HTTPS works
- ✅ Application functions correctly

---

## 💡 Key Points

- **Domain must be on frontend SERVICE**, not backend or app level
- **Internal port must be 3000**, not 80 or empty
- **Health check must be correct** or disabled
- **Only ONE app/service** should have the domain
- **Redeploy after changes** - proxy needs to update

The containers are working - we just need Coolify's proxy configured correctly!

