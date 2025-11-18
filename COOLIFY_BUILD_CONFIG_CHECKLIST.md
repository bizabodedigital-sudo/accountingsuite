# Coolify Build Configuration Checklist

## Problem: Zero Logs = Build Never Started

If Coolify shows **ZERO logs** for the frontend build, Coolify never even executed the Dockerfile. This means a configuration issue, not a code issue.

## ✅ Checklist - Fix These 4 Things

### 1️⃣ Build Path (CRITICAL)

**Location:** Coolify → Frontend → Settings → Build → "Build Path"

**Must be:**
```
frontend
```

**NOT:**
- `/`
- `app`
- `./app`
- `backend`
- Empty

**Why:** Coolify needs to know which directory contains your Dockerfile.

---

### 2️⃣ Dockerfile Path

**Location:** Coolify → Frontend → Settings → Build → "Dockerfile Path"

**If Build Path is `frontend`, then Dockerfile Path should be:**
```
Dockerfile
```

**OR if Build Path is root (`/`), then Dockerfile Path should be:**
```
frontend/Dockerfile
```

**Why:** Dockerfile path is relative to the Build Path.

---

### 3️⃣ Build Arguments (REQUIRED)

**Location:** Coolify → Frontend → Settings → Build → "Build Arguments"

**You MUST set these:**

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

**Example:**
```
NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org/api
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

**Why:** These are ARG variables in the Dockerfile. If missing, Coolify may abort before starting the build.

---

### 4️⃣ Repository Access

**Location:** Coolify → Sources → Check repository status

**Common Issues:**

#### ❌ Problem: GitHub Deploy Key Conflict
- GitHub allows **only ONE deploy key per repository**
- If you have multiple Coolify apps using the same repo, only one will work

#### ✅ Solution: Use GitHub App Instead
1. Go to **Coolify → Sources**
2. Remove the old GitHub deploy key
3. Add **GitHub App** integration
4. Re-select your repository for the frontend service

**Check for:**
- ✅ Repository accessible
- ✅ Authentication successful
- ✅ SSH key present (or GitHub App installed)
- ❌ "Repository not accessible"
- ❌ "Authentication failed"
- ❌ "SSH key missing"

---

## 🎯 Quick Verification Steps

1. **Go to:** Coolify → Frontend → Settings → Build

2. **Verify:**
   - Build Path: `frontend`
   - Dockerfile Path: `Dockerfile` (or `frontend/Dockerfile` if Build Path is `/`)
   - Build Arguments: Both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are set

3. **Check Repository:**
   - Go to Sources
   - Verify repository is connected
   - If using deploy key and have multiple apps, switch to GitHub App

4. **Redeploy:**
   - After fixing the above, click **Redeploy**
   - You should now see build logs

---

## 📋 Expected Log Output (After Fix)

Once configured correctly, you should see:

```
🔍 PRE-INSTALL DIAGNOSTICS
Node.js version: v22.x.x
NPM version: 11.x.x
...
```

If you see this, the build is running and we can debug any actual build errors.

---

## 🔍 Debugging Tips

### If Still No Logs After Fixing Above:

1. **Check Coolify Build History:**
   - Look for failed builds
   - Check if builds are even being triggered

2. **Verify Git Branch:**
   - Ensure Coolify is pulling from `main` branch
   - Check if latest commits are visible

3. **Check Coolify Server Logs:**
   - If you have SSH access to Coolify server
   - Check Docker daemon logs
   - Check Coolify application logs

4. **Test Build Locally:**
   - Run `docker build -t test-frontend ./frontend` locally
   - If this works, the issue is definitely Coolify configuration

---

## 📸 What to Share for Help

If you want help diagnosing, share:

1. **Screenshot of:** Coolify → Frontend → Settings → Build
   - Build Path value
   - Dockerfile Path value
   - Build Arguments (can blur sensitive URLs)

2. **Repository Status:**
   - Screenshot of Sources page
   - Or tell me if you see any errors

3. **Build History:**
   - Any failed builds?
   - Any builds at all?

