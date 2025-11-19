# Coolify Setup Guide - Fixing Deployment Issues

## 🔴 Current Issues

1. **Backend**: Missing `JWT_SECRET` environment variable (crashing repeatedly)
2. **Frontend**: Not appearing in logs (likely not deployed or build failing)

## ✅ Step-by-Step Fix

### 1. Set Environment Variables in Coolify

Go to your project in Coolify → **Shared Variables** or **Environment Variables** and add:

#### Required Variables (MUST HAVE):

```env
# JWT Secret (REQUIRED - generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# Database URLs
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379

# Frontend URLs (for CORS and redirects)
FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com

# S3/MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# MongoDB Configuration
MONGO_DATABASE=bizabode
MONGO_ROOT_USERNAME=your-mongo-root-user
MONGO_ROOT_PASSWORD=your-mongo-root-password

# MinIO Root Credentials
MINIO_ROOT_USER=your-minio-root-user
MINIO_ROOT_PASSWORD=your-minio-root-password
MINIO_BUCKET=bizabode-accounting

# Mongo Express (optional)
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=your-mongo-express-password
```

#### Optional Variables:

```env
# Email Configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### 2. Verify Docker Compose Configuration

1. Go to your Docker Compose resource in Coolify
2. Check that the **Docker Compose File** is set to: `docker-compose.coolify.yml`
3. Verify all services are selected:
   - ✅ mongo
   - ✅ redis
   - ✅ minio
   - ✅ backend
   - ✅ frontend
   - ✅ worker (optional)
   - ✅ mongo-express (optional)

### 3. Check Frontend Service Status

1. In Coolify, go to your Docker Compose resource
2. Look for the **frontend** service
3. Check:
   - Is it showing as "Running" or "Stopped"?
   - Click on the frontend service
   - Go to **Logs** tab - are there any build errors?
   - Go to **Builds** tab - did the build succeed?

### 4. Redeploy Services

After setting environment variables:

1. **Stop** all services
2. **Redeploy** the Docker Compose resource
3. Wait for services to start (check health checks)

### 5. Generate JWT_SECRET

**✅ Already Generated!** Use this secure JWT_SECRET:

```
SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=
```

Copy this value and paste it into Coolify's Shared Variables as `JWT_SECRET`.

**Or generate a new one:**

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use an online generator: https://generate-secret.vercel.app/32

## 🔍 Troubleshooting

### Backend Still Crashing

1. **Check Environment Variables**:
   - Go to Coolify → Your Project → Shared Variables
   - Verify `JWT_SECRET` is set and not empty
   - Make sure variables are available to the backend service

2. **Check Variable Scope**:
   - Variables should be set at the **Project** or **Resource** level
   - Not just at the service level (for Docker Compose)

3. **Check Logs**:
   - Look for the exact error message
   - Verify which variables are missing

### Frontend Not Showing Up

1. **Check if Frontend Service Exists**:
   - In Coolify Docker Compose view, scroll through all services
   - Frontend should be listed alongside backend, mongo, etc.

2. **Check Build Logs**:
   - Click on frontend service → **Builds** tab
   - Look for build errors (might be failing silently)
   - Common issues:
     - Build timeout (Next.js builds can take 5-10 minutes)
     - Memory issues (increase build resources)
     - Missing build arguments

3. **Check Service Selection**:
   - When deploying Docker Compose, Coolify might let you select which services to deploy
   - Make sure **frontend** is checked/enabled

4. **Manual Frontend Check**:
   - Try accessing the frontend URL directly
   - Check if it's responding (even if backend is down)

### Frontend Build Failing

If frontend build is failing, check:

1. **Build Arguments**:
   - `NEXT_PUBLIC_API_URL` must be set during build
   - `NEXT_PUBLIC_APP_URL` must be set during build
   - These are passed via `build.args` in docker-compose

2. **Build Context**:
   - Should be `./frontend` or `frontend`
   - Dockerfile should be at `frontend/Dockerfile`

3. **Memory Issues**:
   - Next.js builds require significant memory
   - Increase build resources in Coolify if possible

## 📋 Quick Checklist

- [ ] `JWT_SECRET` is set in Coolify Shared Variables
- [ ] All required environment variables are set
- [ ] Docker Compose file is `docker-compose.coolify.yml`
- [ ] Frontend service is selected/enabled in Docker Compose
- [ ] All services are redeployed after setting variables
- [ ] Checked frontend build logs for errors
- [ ] Verified frontend service exists in Coolify

## 🚀 After Fixing

Once environment variables are set:

1. **Backend** should start successfully
2. **Frontend** should appear in logs and start building
3. All services should show as "Running" in Coolify

If issues persist, check:
- Coolify logs for each service
- Build logs for frontend
- Network connectivity between services
- Health check endpoints

