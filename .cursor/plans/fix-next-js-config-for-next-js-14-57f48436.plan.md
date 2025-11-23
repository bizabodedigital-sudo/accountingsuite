<!-- 57f48436-5259-4635-a305-2fc1f345c9cc 8f83e31b-62bd-4440-938c-81c3658d80fe -->
# Production Readiness Checklist

## Critical Security Fixes

### 1. Remove Default Passwords (docker-compose.yml)

**File:** `docker-compose.yml`

- Replace MinIO default credentials (`minioadmin`/`minioadmin123`) with environment variables
- Replace Mongo Express default password (`admin123`) with environment variable
- Use secure random passwords generated via environment variables

### 2. Ensure Authentication is Enabled

**File:** `docker-compose.yml` and Coolify Environment Variables

- Verify `DISABLE_AUTH=false` is set in production
- Remove or document the authentication bypass feature for production use
- Add validation to prevent `DISABLE_AUTH=true` in production environment

### 3. Secure JWT Secret

**Action Required in Coolify:**

- Generate strong JWT_SECRET: `openssl rand -base64 32`
- Set `JWT_SECRET` in Coolify environment variables (never use default)
- Ensure JWT_SECRET is at least 32 characters long

## Domain Configuration in Coolify

### 4. Configure Frontend Domain

**In Coolify Destinations:**

- Add domain pointing to `frontend` service on port `3000`
- Example: `https://accountingsuite.bizabodeserver.org` → `frontend:3000`
- Verify domain is Active/Enabled

### 5. Configure Backend API Domain

**In Coolify Destinations:**

- Add API domain pointing to `backend` service on port `3001`
- Example: `https://api.accountingsuite.bizabodeserver.org` → `backend:3001`
- Ensure CORS allows frontend domain

## Environment Variables Setup

### 6. Required Environment Variables in Coolify

**Set these in Coolify's Shared Variables or per-service:**

**Backend Service:**

```
JWT_SECRET=<generated-secure-secret>
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379
FRONTEND_URL=https://accountingsuite.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
DISABLE_AUTH=false
S3_ENDPOINT=http://minio:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=<secure-access-key>
S3_SECRET_KEY=<secure-secret-key>
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

**Frontend Service (Build Args):**

```
NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

**Frontend Service (Runtime):**

```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_API_URL=https://api.accountingsuite.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
```

**MinIO Service:**

```
MINIO_ROOT_USER=<secure-username>
MINIO_ROOT_PASSWORD=<secure-password>
```

## Code Fixes

### 7. Fix TypeScript Build Errors

**File:** `frontend/next.config.js`

- Current: `ignoreBuildErrors: false` (will fail build on TS errors)
- Action: Fix all TypeScript errors OR set to `true` temporarily
- Recommendation: Fix errors for production quality

### 8. Update docker-compose.yml for Security

**File:** `docker-compose.yml`

- Replace hardcoded MinIO credentials with environment variables
- Replace hardcoded Mongo Express password with environment variable
- Add validation comments for production

## Deployment Verification

### 9. Pre-Deployment Checklist

- [ ] All environment variables set in Coolify
- [ ] Domains configured in Coolify Destinations
- [ ] JWT_SECRET generated and set
- [ ] DISABLE_AUTH=false
- [ ] Default passwords changed
- [ ] TypeScript errors resolved
- [ ] Health checks passing
- [ ] All containers starting successfully

### 10. Post-Deployment Verification

- [ ] Frontend accessible at configured domain
- [ ] Backend API accessible at configured domain
- [ ] Login functionality works
- [ ] CORS errors resolved
- [ ] Static assets loading (no 502/404 errors)
- [ ] Health checks passing for all services
- [ ] No authentication bypass active
- [ ] Database connections working
- [ ] File uploads working (MinIO)

## Documentation Updates

### 11. Create Production Deployment Guide

**New File:** `PRODUCTION_DEPLOYMENT.md`

- Step-by-step Coolify deployment instructions
- Environment variables reference
- Domain configuration guide
- Security checklist
- Troubleshooting common issues

### 12. Update Security Documentation

**Update:** `PRODUCTION_OPTIMIZATIONS.md`

- Add security hardening section
- Document authentication requirements
- Password management guidelines
- JWT secret generation instructions

### To-dos

- [ ] Investigate 502 errors on static chunks - check Next.js server configuration
- [ ] Verify Dockerfile static file serving setup
- [ ] Add better error handling and logging for static file requests
- [ ] Test deployment after fixes
- [ ] Convert postcss.config.mjs to postcss.config.js with CommonJS format (module.exports)
- [ ] Replace @import tailwindcss with @tailwind base/components/utilities directives in globals.css
- [ ] Verify package.json and tailwind.config.js are correct (no changes needed)