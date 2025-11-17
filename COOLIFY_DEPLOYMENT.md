# Coolify Deployment Guide

This guide explains how to deploy the Bizabode Accounting Suite to Coolify.

## 📋 Prerequisites

1. A Coolify instance running (self-hosted or cloud)
2. Git repository with your code
3. MongoDB and Redis databases (can be deployed via Coolify or external)

## 🏗️ Project Structure

Your project has the following structure:
```
Biz Accounts/
├── backend/
│   ├── Dockerfile          # Used by backend and worker
│   └── src/
├── frontend/
│   ├── Dockerfile          # Used by frontend
│   └── src/
├── docker-compose.yml      # Development compose file
├── docker-compose.prod.yml # Production compose file
└── docker-compose.coolify.yml # Coolify-optimized compose file (recommended)
```

**Note**: Use `docker-compose.coolify.yml` for Coolify deployments as it's optimized for Coolify's container naming and management.

## 🚀 Deployment Steps

### Option A: Deploy Using Docker Compose (Recommended)

**This is the easiest way to deploy all services at once:**

1. **Create New Resource** → **Docker Compose**
2. **Docker Compose File**: `docker-compose.coolify.yml`
3. **Select Services**: Choose which services to deploy (or deploy all)
4. **Environment Variables**: Set all required environment variables (see below)
5. **Deploy**: Coolify will build and start all selected services

**Advantages:**
- Deploys all services together
- Handles dependencies automatically
- Uses health checks to ensure proper startup order
- Coolify manages container names automatically

### Option B: Deploy Services Individually

### 1. Deploy Backend Service

1. **Create New Resource** → **Dockerfile**
2. **Build Context**: `./backend` (or `backend/` if using relative path)
3. **Dockerfile Path**: `Dockerfile` (relative to build context)
4. **Port**: `3001`
5. **Environment Variables** (see below)

### 2. Deploy Frontend Service

1. **Create New Resource** → **Dockerfile**
2. **Build Context**: `./frontend` (or `frontend/`)
3. **Dockerfile Path**: `Dockerfile`
4. **Port**: `3000`
5. **Environment Variables** (see below)

### 3. Deploy Worker Service

**⚠️ IMPORTANT**: The worker uses the same Dockerfile as the backend, but with a different command.

1. **Create New Resource** → **Dockerfile**
2. **Build Context**: `./backend` (or `backend/`)
3. **Dockerfile Path**: `Dockerfile`
4. **Port**: Not needed (background service)
5. **Command Override**: `node src/worker.js` (or `npm run worker`)
6. **Environment Variables**: Same as backend (see below)

### 4. Deploy Databases (Optional - if using Coolify)

#### MongoDB
- Use Coolify's MongoDB service or external MongoDB
- Default port: `27017`

#### Redis
- Use Coolify's Redis service or external Redis
- Default port: `6379`

## 🔧 Environment Variables

### Backend Service

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-mongo-host:27017/bizabode
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=1h
FRONTEND_URL=https://your-frontend-domain.com

# S3/MinIO Configuration
S3_ENDPOINT=http://your-s3-endpoint:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend Service

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

### Worker Service

Same as Backend Service (all environment variables)

## 🐳 Dockerfile Configuration in Coolify

### For Backend/Worker:

**Build Context**: 
```
backend
```
or
```
./backend
```

**Dockerfile Path**:
```
Dockerfile
```

**Command Override** (for worker only):
```
node src/worker.js
```

### For Frontend:

**Build Context**:
```
frontend
```
or
```
./frontend
```

**Dockerfile Path**:
```
Dockerfile
```

## 🔍 Troubleshooting

### Error: "failed to read dockerfile: open Dockerfile: no such file or directory"

**Solution**: 
1. Check that your **Build Context** is set correctly:
   - For backend/worker: `backend` or `./backend`
   - For frontend: `frontend` or `./frontend`

2. Check that your **Dockerfile Path** is relative to the build context:
   - If build context is `backend`, Dockerfile path should be `Dockerfile`
   - If build context is root (`.`), Dockerfile path should be `backend/Dockerfile`

3. Verify the Dockerfile exists in the correct location:
   - Backend Dockerfile: `backend/Dockerfile`
   - Frontend Dockerfile: `frontend/Dockerfile`

### Error: "No such container: [service-name]-[hash]"

**This error occurs when containers haven't been created yet or failed to start.**

**Solutions**:

1. **If using Docker Compose:**
   - Use `docker-compose.coolify.yml` instead of `docker-compose.yml`
   - The Coolify-optimized file removes explicit `container_name` fields, allowing Coolify to manage container names
   - Make sure all services are set to "Start" in Coolify
   - Check the build logs to see if containers are being created

2. **Check Build Status:**
   - Go to each service in Coolify
   - Check the "Builds" tab to see if the build succeeded
   - If build failed, check the build logs for errors

3. **Verify Docker Compose File:**
   - Ensure you're using `docker-compose.coolify.yml` (recommended for Coolify)
   - Or remove `container_name` fields from your compose file
   - Coolify generates its own container names based on project/service names

4. **Start Services:**
   - In Coolify, make sure all services are in "Running" state
   - If services show as "Stopped", click "Start" or "Redeploy"
   - Wait for services to fully start (check health checks)

5. **Check Dependencies:**
   - Ensure MongoDB and Redis are running first
   - Backend and Worker depend on MongoDB and Redis
   - Frontend depends on Backend
   - Services with `depends_on` will wait for dependencies to be healthy

### Common Issues

1. **Build Context Wrong**: 
   - ❌ Build Context: `.` (root) with Dockerfile: `Dockerfile`
   - ✅ Build Context: `backend` with Dockerfile: `Dockerfile`

2. **Dockerfile Path Wrong**:
   - ❌ Build Context: `backend` with Dockerfile: `backend/Dockerfile`
   - ✅ Build Context: `backend` with Dockerfile: `Dockerfile`

3. **Worker Not Starting**:
   - Make sure to set the command override: `node src/worker.js`

## 📝 Quick Reference

| Service | Build Context | Dockerfile Path | Port | Command |
|---------|--------------|-----------------|------|---------|
| Backend | `backend` | `Dockerfile` | 3001 | (default) |
| Frontend | `frontend` | `Dockerfile` | 3000 | (default) |
| Worker | `backend` | `Dockerfile` | - | `node src/worker.js` |

## 🔗 Service Dependencies

- Backend depends on: MongoDB, Redis
- Frontend depends on: Backend (via API URL)
- Worker depends on: MongoDB, Redis

Make sure to configure the connection strings correctly in environment variables.

## ✅ Verification

After deployment:

1. **Backend Health Check**: 
   ```
   curl https://your-backend-domain.com/healthz
   ```

2. **Frontend**: 
   - Visit `https://your-frontend-domain.com`
   - Should load the application

3. **Worker**: 
   - Check logs in Coolify
   - Should show worker starting without errors

## 🎯 Production Recommendations

1. Use environment variables for all secrets
2. Enable SSL/TLS certificates in Coolify
3. Set up proper database backups
4. Configure monitoring and logging
5. Use production Dockerfile optimizations (multi-stage builds)
6. Set resource limits for containers

