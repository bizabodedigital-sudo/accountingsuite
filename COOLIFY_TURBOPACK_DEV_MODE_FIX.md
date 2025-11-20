# 🔧 Fix Turbopack Errors - Frontend Running in Dev Mode

## ❌ Error

```
turbopack-56af255d73aa8db2.js:1 Uncaught Error: Failed to load chunk
GET https://accountingsuite.bizabodeserver.org/_next/static/chunks/...js 
net::ERR_ABORTED 502 (Bad Gateway)
```

**Problem:** Frontend is running in **development mode** (with Turbopack) instead of **production mode**. Turbopack is Next.js's dev bundler and shouldn't be used in production.

---

## 🔍 Root Causes

1. **Frontend service running `npm run dev`** instead of `npm start`
2. **NODE_ENV not set to production** in runtime environment
3. **Build incomplete** - Production build not created properly
4. **Wrong command in Dockerfile** - Using dev command instead of start
5. **Environment override** - Coolify might be overriding the command

---

## ✅ Solution Steps

### Step 1: Check What Command is Running

**In Coolify → Frontend Service → Logs:**

Look for the startup command. Should see:
- ✅ **Correct:** `npm start` or `next start`
- ❌ **Wrong:** `npm run dev` or `next dev`

**If you see "Turbopack" or "dev" in logs:**
- Frontend is running in development mode
- Need to fix the command

---

### Step 2: Check Dockerfile Command

**The Dockerfile should have:**

```dockerfile
CMD ["npm", "start"]
```

**NOT:**
```dockerfile
CMD ["npm", "run", "dev"]  # ❌ Wrong
```

---

### Step 3: Check Environment Variables

**In Coolify → Frontend Service → Environment Variables:**

Make sure:
```env
NODE_ENV=production
```

**NOT:**
```env
NODE_ENV=development  # ❌ Wrong
```

---

### Step 4: Verify Build Completed

**In Coolify → Frontend Service → Build Logs:**

Should see:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

**If build failed or incomplete:**
- Rebuild the frontend service
- Check for build errors

---

### Step 5: Check Runtime Command in Coolify

**In Coolify → Frontend Service → Settings:**

1. **Check "Command" or "Start Command":**
   - Should be: `npm start` or empty (use Dockerfile CMD)
   - Should NOT be: `npm run dev`

2. **If command is set:**
   - Remove it or change to `npm start`
   - Let Dockerfile CMD handle it

---

## 🎯 Quick Fix

### Fix 1: Rebuild Frontend (Recommended)

**In Coolify → Frontend Service:**

1. **Go to Builds tab**
2. **Click "Rebuild"**
3. **Wait for build to complete**
4. **Service should auto-start with correct command**

This ensures:
- Fresh production build
- Correct Dockerfile CMD is used
- NODE_ENV=production is set

---

### Fix 2: Check and Fix Command Override

**In Coolify → Frontend Service → Settings:**

1. **Look for "Command" or "Start Command" field**
2. **If set to `npm run dev`:**
   - Change to: `npm start`
   - Or remove it (use Dockerfile default)

3. **Save and restart service**

---

### Fix 3: Verify Environment Variables

**In Coolify → Frontend Service → Environment Variables:**

**Required:**
```env
NODE_ENV=production
```

**If NODE_ENV is missing or set to development:**
1. Add/update: `NODE_ENV=production`
2. Save
3. Restart service

---

### Fix 4: Check Dockerfile is Correct

**Verify `frontend/Dockerfile` has:**

```dockerfile
# Production runner stage
FROM node:22-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production  # ✅ Must be production

# ... copy files ...

CMD ["npm", "start"]  # ✅ Must be start, not dev
```

**If wrong, update and rebuild.**

---

## 🔍 Verification

### Check Logs for Production Mode

**In Coolify → Frontend Service → Logs:**

**Should see:**
```
✓ Ready in ...ms
- Local: http://localhost:3000
```

**Should NOT see:**
```
- Turbopack (bundler)
- dev server
- compiled /_next/static/chunks (dev mode)
```

### Check Browser Network Tab

**After fixing:**

1. **Open browser DevTools → Network**
2. **Refresh page**
3. **Check chunk files:**
   - Should load from `/_next/static/chunks/`
   - Status: 200 (not 502)
   - No Turbopack references

### Check Browser Console

**Should NOT see:**
- ❌ `turbopack-*.js` errors
- ❌ "Failed to load chunk" errors
- ❌ Development mode warnings

**Should see:**
- ✅ Page loads normally
- ✅ No console errors
- ✅ Application works

---

## 📋 Checklist

- [ ] Frontend service command is `npm start` (not `npm run dev`)
- [ ] `NODE_ENV=production` is set in environment variables
- [ ] Dockerfile CMD is `["npm", "start"]`
- [ ] Build completed successfully
- [ ] No command override in Coolify settings
- [ ] Frontend logs show production mode (not dev)
- [ ] No Turbopack references in logs or browser
- [ ] Static chunks load successfully (200 status)

---

## 🆘 Still Seeing Turbopack Errors?

### Debug Steps:

1. **Check actual running process:**
   ```bash
   # In Coolify → Frontend Service → Terminal
   ps aux | grep node
   # Should see "next start" not "next dev"
   ```

2. **Check environment:**
   ```bash
   # In container
   echo $NODE_ENV
   # Should output: production
   ```

3. **Check package.json scripts:**
   ```bash
   # In container
   cat package.json | grep -A 5 '"scripts"'
   # Verify "start": "next start"
   ```

4. **Force production mode:**
   ```bash
   # In Coolify → Frontend Service → Environment Variables
   NODE_ENV=production
   # Save and restart
   ```

---

## 💡 Why This Happens

**Common causes:**

1. **Coolify command override** - Settings override Dockerfile CMD
2. **Environment variable** - NODE_ENV set to development
3. **Build failure** - Production build didn't complete, falling back to dev
4. **Wrong Dockerfile** - Using dev Dockerfile instead of production
5. **Cache issues** - Old dev build cached

---

## ✅ Success Indicators

After fixing:

- ✅ Frontend logs show: `✓ Ready` (production mode)
- ✅ No Turbopack references in logs
- ✅ Browser Network tab shows chunks loading (200 status)
- ✅ No console errors about failed chunks
- ✅ Application works normally
- ✅ Fast page loads (production optimizations active)

---

## 🔗 Related Issues

- **502 errors on static files:** See `COOLIFY_FRONTEND_502_STATIC_FILES.md`
- **Frontend build failing:** See `COOLIFY_FRONTEND_BUILD_FIX.md`
- **Domain routing issues:** See `COOLIFY_502_DOMAIN_TROUBLESHOOT.md`

