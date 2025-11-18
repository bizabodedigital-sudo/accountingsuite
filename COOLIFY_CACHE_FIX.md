# Coolify Build Cache Issue - Troubleshooting Guide

## Problem
Coolify is still showing an error with `npm ci` even though the Dockerfile has been updated to use `npm install` and pushed to the repository.

## Verification Results

✅ **Dockerfile is Correct**
- File: `frontend/Dockerfile`
- Line 24: Uses `npm install --legacy-peer-deps` (NOT `npm ci`)
- Commit: `607a0cd` - "Fix Dockerfile: use npm install instead of npm ci for better compatibility"
- Status: Committed and pushed to `origin/main`

## Root Cause
Coolify is likely using **cached Docker build layers** from a previous build. Docker caches each layer, and if the cache hasn't been invalidated, it will reuse the old layer containing `npm ci`.

## Solutions

### Solution 1: Clear Build Cache in Coolify (Recommended)

1. **In Coolify Dashboard:**
   - Go to your Frontend service
   - Navigate to **Builds** tab
   - Look for a **"Clear Cache"** or **"Rebuild without cache"** option
   - If available, click it and trigger a new build

2. **Force Rebuild:**
   - Go to **Deployments** or **Builds** section
   - Click **"Redeploy"** or **"Rebuild"**
   - Look for **"Build without cache"** or **"No cache"** option
   - Enable it and start the build

### Solution 2: Invalidate Docker Cache by Changing Dockerfile

If Coolify doesn't have a clear cache option, we can force cache invalidation by making a small change to the Dockerfile:

**Option A: Add a comment to force cache invalidation**
```dockerfile
# Install ALL dependencies (including devDependencies needed for build)
# Using npm install (more forgiving than npm ci if lock file is out of sync)
# Cache buster: 2025-11-18
RUN npm install --legacy-peer-deps && \
    npm cache clean --force
```

**Option B: Add an ARG that changes**
```dockerfile
# Force cache invalidation
ARG CACHE_BUST=1
RUN npm install --legacy-peer-deps && \
    npm cache clean --force
```

### Solution 3: Verify Coolify Configuration

Check these settings in Coolify:

1. **Build Context:**
   - Should be: `frontend` or `./frontend`
   - NOT: `.` (root) or `frontend/`

2. **Dockerfile Path:**
   - Should be: `Dockerfile`
   - NOT: `frontend/Dockerfile` (if build context is `frontend`)

3. **Git Branch:**
   - Should be: `main`
   - Verify Coolify is pulling from the correct branch

4. **Git Repository:**
   - Ensure Coolify has pulled the latest code
   - Check if there's a "Pull latest" or "Refresh" button

### Solution 4: Manual Cache Clear (If you have SSH access)

If you have SSH access to the Coolify server:

```bash
# Clear Docker build cache
docker builder prune -af

# Or clear all Docker cache
docker system prune -af
```

## Verification Steps

After applying a solution:

1. **Check Build Logs:**
   - Look for the line: `RUN npm install --legacy-peer-deps`
   - Should NOT see: `RUN npm ci --legacy-peer-deps`

2. **Verify Build Success:**
   - Build should complete without the `npm ci` error
   - Should proceed to the `npm run build` step

## Prevention

To avoid this in the future:

1. **Use Build Arguments for Cache Busting:**
   ```dockerfile
   ARG BUILD_DATE
   ARG CACHE_BUST=1
   ```

2. **Clear Cache Periodically:**
   - Set up a schedule to clear build cache
   - Or use `--no-cache` flag for important builds

3. **Monitor Build Logs:**
   - Always check that the correct commands are being executed
   - Verify environment variables are set correctly

## Quick Fix Command

If you want to force a cache-busting change right now, I can add a comment or ARG to the Dockerfile to invalidate the cache.

