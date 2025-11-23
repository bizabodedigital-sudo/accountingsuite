# Remove Mongo Express - Use Minimal Setup

## The Issue

You're seeing Mongo Express logs, but Mongo Express is **NOT** in the minimal setup. This means Coolify is either:
1. Using an old docker-compose file (like `docker-compose.coolify.yml`)
2. Has cached/old containers still running
3. Needs to be redeployed with the new `docker-compose.yml`

## Quick Fix

### Step 1: Verify Coolify is Using the Right File

1. Go to **Coolify** → Your Docker Compose Resource
2. Check **"Docker Compose File"** setting
3. **Should be:** `docker-compose.yml` (not `docker-compose.coolify.yml`)

### Step 2: Stop and Remove Old Services

1. **Stop** the Docker Compose resource in Coolify
2. **Remove** all containers (or let Coolify clean them up)
3. This will stop Mongo Express and other old services

### Step 3: Redeploy with Minimal Setup

1. **Redeploy** the Docker Compose resource
2. Coolify will use the new `docker-compose.yml` (minimal setup)
3. Only 3 services will start:
   - ✅ MongoDB
   - ✅ Backend
   - ✅ Frontend
   - ❌ Mongo Express (removed)
   - ❌ Redis (removed)
   - ❌ MinIO (removed)

## What You Should See After Redeploy

**Only these services:**
- `mongo` - MongoDB database
- `backend` - API server
- `frontend` - Next.js app

**You should NOT see:**
- ❌ `mongo-express` (removed)
- ❌ `redis` (removed)
- ❌ `minio` (removed)
- ❌ `worker` (removed)

## If Mongo Express Still Appears

1. **Check which compose file Coolify is using**
2. **Manually stop Mongo Express container** if it exists
3. **Verify** `docker-compose.yml` doesn't have Mongo Express (it shouldn't)

## The Minimal Setup

The new `docker-compose.yml` only has:
- MongoDB
- Backend
- Frontend

That's it. Clean and simple.

