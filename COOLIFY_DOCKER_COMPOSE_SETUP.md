# Coolify Docker Compose Deployment Guide

## 🚀 Quick Start: Deploy with Docker Compose from Git

This guide shows you how to deploy your entire stack using `docker-compose.yml` in Coolify.

## Step 1: Push to Git

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add production docker-compose setup"

# Push to your repository
git push origin main
```

## Step 2: Deploy in Coolify

### Option A: Docker Compose Resource (Recommended)

1. **Go to Coolify** → **New Resource** → **Docker Compose**

2. **Configure:**
   - **Name**: `accounting-suite` (or your preferred name)
   - **Source**: Your Git repository
   - **Branch**: `main` (or your branch)
   - **Docker Compose File**: `docker-compose.yml`
   - **Root Directory**: `/` (root of repository)

3. **Set Environment Variables** (in Coolify UI):
   ```
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   FRONTEND_URL=https://accountingsuite.bizabodeserver.org
   NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
   NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
   S3_ACCESS_KEY=your-minio-key
   S3_SECRET_KEY=your-minio-secret
   ```

4. **Set Build Arguments** (for frontend service):
   - In Coolify, go to the frontend service settings
   - Add build arguments:
     ```
     NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
     NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
     ```

5. **Deploy**: Click "Deploy" and Coolify will:
   - Clone your repository
   - Build all services from Dockerfiles
   - Start all services with proper dependencies
   - Set up networking between services

## Step 3: Configure Domains

### Frontend Domain
1. Go to **Frontend Service** → **Domains**
2. Add domain: `accountingsuite.bizabodeserver.org`
3. Port: `3000`
4. Enable HTTPS

### Backend API Domain (Optional)
1. Go to **Backend Service** → **Domains**
2. Add domain: `api.accountingsuite.bizabodeserver.org`
3. Port: `3001`
4. Enable HTTPS

## 📋 What Gets Deployed

When you deploy with `docker-compose.yml`, Coolify will:

1. **MongoDB** (port 27017)
   - Database with persistent volume
   - Health checks enabled

2. **Redis** (port 6379)
   - Cache/queue service
   - Health checks enabled

3. **Backend** (port 3001)
   - Express.js API server
   - Built from `backend/Dockerfile`
   - Connects to MongoDB and Redis
   - Health check: `/healthz`

4. **Frontend** (port 3000)
   - Next.js application
   - Built from `frontend/Dockerfile`
   - Uses Next.js API proxy to backend
   - Health check: HTTP 200 on port 3000

## 🔧 Environment Variables

### Required Variables

Set these in Coolify → Docker Compose Resource → Environment Variables:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# Frontend URLs
FRONTEND_URL=https://accountingsuite.bizabodeserver.org
NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org

# MinIO S3 (if using)
S3_ENDPOINT=http://minio:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

### Build Arguments (Frontend)

Set these in Coolify → Frontend Service → Build Arguments:

```bash
NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

## 🔄 How It Works

```
┌─────────────┐
│   Frontend  │ (Port 3000)
│  (Next.js)  │
└──────┬──────┘
       │
       │ /api/* → Next.js API Proxy
       │
┌──────▼──────┐
│   Backend   │ (Port 3001)
│  (Express)  │
└──────┬──────┘
       │
       ├───► MongoDB (Port 27017)
       └───► Redis (Port 6379)
```

1. **Frontend** serves Next.js app on port 3000
2. **API Requests** go to `/api/*` routes
3. **Next.js Proxy** (`frontend/src/app/api/[...path]/route.ts`) forwards to backend
4. **Backend** processes requests and connects to MongoDB/Redis
5. **MongoDB** stores all data persistently

## 🧪 Testing After Deployment

### 1. Check All Services Are Running

In Coolify, verify all services show "Running" status:
- ✅ MongoDB: Running
- ✅ Redis: Running
- ✅ Backend: Running (healthy)
- ✅ Frontend: Running (healthy)

### 2. Test Backend Health

```bash
curl https://api.accountingsuite.bizabodeserver.org/healthz
```

Expected: `{"success":true,"message":"Server is healthy",...}`

### 3. Test Frontend

Open in browser: `https://accountingsuite.bizabodeserver.org`

Should load the login page.

### 4. Test Login

```bash
curl -X POST https://accountingsuite.bizabodeserver.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@jamaicatech.com","password":"password123"}'
```

Expected: JWT token response

## 🔄 Updating/Re-deploying

### After Pushing Changes to Git

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```

2. **In Coolify:**
   - Go to your Docker Compose resource
   - Click **"Redeploy"** or **"Rebuild"**
   - Coolify will pull latest code and rebuild

### Rebuild Specific Service

If you only changed one service:

1. Go to that service in Coolify
2. Click **"Rebuild"**
3. Only that service will rebuild

## 🐛 Troubleshooting

### Services Won't Start

1. **Check Logs:**
   - Go to each service in Coolify
   - Click "Logs" tab
   - Look for errors

2. **Check Health Checks:**
   - Services must pass health checks before dependencies start
   - MongoDB must be healthy before backend starts
   - Backend must be healthy before frontend starts

3. **Check Environment Variables:**
   - All required variables must be set
   - `JWT_SECRET` is required
   - `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are required

### Frontend Can't Connect to Backend

1. **Check `BACKEND_URL`:**
   - Should be `http://backend:3001` (internal Docker network)
   - Set automatically in docker-compose.yml

2. **Check Network:**
   - All services must be on `bizabode-network`
   - Check in Coolify → Services → Network settings

### Build Fails

1. **Check Build Arguments:**
   - Frontend needs `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` at build time
   - Set in Coolify → Frontend Service → Build Arguments

2. **Check Dockerfile Paths:**
   - Backend: `backend/Dockerfile`
   - Frontend: `frontend/Dockerfile`
   - Both should exist in your repository

## 📝 Git Workflow

### Typical Workflow

```bash
# 1. Make changes locally
# ... edit files ...

# 2. Test locally (optional)
docker-compose up --build

# 3. Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# 4. Coolify auto-deploys (if webhook configured)
# OR manually redeploy in Coolify
```

### Branch Strategy

- **main/master**: Production deployments
- **develop**: Development/testing
- **feature/***: Feature branches

Coolify can deploy from any branch - just select it in the resource settings.

## ✅ Success Checklist

After deployment, verify:

- [ ] All services are "Running" in Coolify
- [ ] Frontend loads at your domain
- [ ] Backend health check returns 200
- [ ] Login works
- [ ] MongoDB data persists (check after restart)
- [ ] No errors in service logs

## 🎉 You're Done!

Your application is now deployed using Docker Compose in Coolify. All services are connected, health checks are passing, and your database is persistent.

