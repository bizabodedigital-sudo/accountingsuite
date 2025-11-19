# 🔧 Fixing Frontend Build Issues in Coolify

## ❌ Problem: Frontend Not Building

After pulling from git, the frontend service isn't being built or deployed.

---

## 🔍 Step-by-Step Troubleshooting

### Step 1: Verify Frontend Service Exists in Docker Compose

**In Coolify:**
1. Go to your Docker Compose resource
2. Check the services list
3. **Verify "frontend" service is listed**

**If frontend is missing:**
- Check Docker Compose file is set to `docker-compose.coolify.yml`
- Verify the file has a `frontend:` service definition
- Redeploy the Docker Compose resource

### Step 2: Check if Frontend Service is Enabled/Selected

**In Coolify Docker Compose:**
- Some Coolify versions let you select which services to deploy
- **Make sure "frontend" is checked/enabled**
- If unchecked, enable it and redeploy

### Step 3: Check Build Logs

**In Coolify → Frontend Service → Builds Tab:**
1. Open the latest build
2. **Look for build errors:**
   - ❌ `npm install` failures
   - ❌ `npm run build` failures
   - ❌ Missing dependencies
   - ❌ TypeScript errors
   - ❌ Memory issues

**Common Build Errors:**

#### Error: "npm install" fails
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```
**Fix:** Check `package.json` dependencies, may need `--legacy-peer-deps`

#### Error: "npm run build" fails
```
Error: Build failed
```
**Fix:** Check for TypeScript errors, missing files, or memory issues

#### Error: Missing environment variables
```
NEXT_PUBLIC_API_URL is not defined
```
**Fix:** Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` in Coolify Shared Variables

#### Error: Out of memory
```
FATAL ERROR: Reached heap limit
```
**Fix:** Increase build memory/resources in Coolify

### Step 4: Check Build Context and Dockerfile Path

**In Coolify → Frontend Service → Settings → Build:**

**Build Context should be:**
```
frontend
```
or
```
./frontend
```

**Dockerfile Path should be:**
```
Dockerfile
```

**NOT:**
- `frontend/Dockerfile` (if build context is already `frontend`)
- `./Dockerfile`
- Empty

### Step 5: Verify Environment Variables for Build

**Required Build-Time Variables:**
- `NEXT_PUBLIC_API_URL` - Must be set during build
- `NEXT_PUBLIC_APP_URL` - Must be set during build

**In Coolify → Shared Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

**Important:** These must be set BEFORE building, as Next.js embeds them at build time.

### Step 6: Check Docker Compose Build Configuration

**Verify docker-compose.coolify.yml has:**

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
```

---

## 🎯 Common Causes & Fixes

### Cause 1: Frontend Service Not Selected

**Symptoms:**
- Frontend doesn't appear in services list
- Or appears but is unchecked/disabled

**Fix:**
1. Go to Docker Compose resource
2. Check service selection
3. Enable/select "frontend" service
4. Redeploy

### Cause 2: Build Context Wrong

**Symptoms:**
- Build fails with "Dockerfile not found"
- Or "package.json not found"

**Fix:**
1. Check Build Context is `frontend` or `./frontend`
2. Check Dockerfile Path is `Dockerfile` (not `frontend/Dockerfile`)
3. Verify `frontend/Dockerfile` exists in repository

### Cause 3: Missing Environment Variables

**Symptoms:**
- Build succeeds but app uses localhost URLs
- Or build fails with undefined variable errors

**Fix:**
1. Set `NEXT_PUBLIC_API_URL` in Coolify Shared Variables
2. Set `NEXT_PUBLIC_APP_URL` in Coolify Shared Variables
3. Rebuild frontend

### Cause 4: Build Fails Due to Errors

**Symptoms:**
- Build logs show errors
- npm install or npm run build fails

**Fix:**
1. Check build logs for specific error
2. Common fixes:
   - Add `--legacy-peer-deps` to npm install (already in Dockerfile)
   - Fix TypeScript errors
   - Increase build memory
   - Check for missing files

### Cause 5: Frontend Waiting for Backend

**Symptoms:**
- Frontend shows "Starting" but never builds
- Logs show waiting for dependencies

**Fix:**
1. Ensure backend is running and healthy first
2. Frontend has `depends_on: backend: condition: service_healthy`
3. Fix backend issues first

---

## ✅ Quick Fix Checklist

- [ ] Frontend service exists in Docker Compose services list
- [ ] Frontend service is enabled/selected for deployment
- [ ] Build Context is `frontend` or `./frontend`
- [ ] Dockerfile Path is `Dockerfile`
- [ ] `NEXT_PUBLIC_API_URL` is set in Coolify Shared Variables
- [ ] `NEXT_PUBLIC_APP_URL` is set in Coolify Shared Variables
- [ ] Backend is running and healthy (frontend depends on it)
- [ ] Checked build logs for errors
- [ ] Docker Compose file is `docker-compose.coolify.yml`
- [ ] Redeployed after making changes

---

## 🚀 Immediate Actions

1. **Check frontend service exists** → Docker Compose → Services list
2. **Check frontend is enabled** → Make sure it's selected for deployment
3. **Check build logs** → Frontend → Builds tab → Look for errors
4. **Set environment variables** → Shared Variables → `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`
5. **Verify build config** → Build Context: `frontend`, Dockerfile: `Dockerfile`
6. **Check backend status** → Frontend depends on backend being healthy
7. **Redeploy** → After fixing issues

---

## 🆘 Still Not Building?

1. **Check Coolify version** - Some versions have different UI for service selection
2. **Try deploying frontend separately** - As a standalone Dockerfile resource instead of Docker Compose
3. **Check repository structure** - Verify `frontend/` folder exists with `Dockerfile`
4. **Check Coolify logs** - Look for deployment errors
5. **Verify git repository** - Make sure latest code is pulled

---

## 📝 Notes

- **Frontend must be explicitly selected** in some Coolify versions
- **Build-time variables** must be set before building
- **Frontend depends on backend** - backend must be healthy first
- **Build can take 5-10 minutes** - be patient
- **Check build logs** for specific error messages

