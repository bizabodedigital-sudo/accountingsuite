# Coolify 502 Error Troubleshooting Guide

## Error: HTTP ERROR 502

A 502 Bad Gateway error means Coolify's reverse proxy (Caddy) cannot reach your application containers.

## Quick Diagnostic Steps

### 1. Check Container Status in Coolify

1. Go to your application in Coolify
2. Click on **"Containers"** or **"Services"** tab
3. Check if all containers are:
   - ✅ **Running** (not stopped/crashed)
   - ✅ **Healthy** (health checks passing)

### 2. Check Container Logs

In Coolify, check logs for each service:

**Frontend:**
```bash
# Look for:
✅ "Ready on http://0.0.0.0:3000"
❌ "Error: listen EADDRINUSE" (port conflict)
❌ "Cannot find module" (missing dependencies)
```

**Backend:**
```bash
# Look for:
✅ "Server running on port 3001"
✅ "MongoDB connected"
❌ "MongoDB connection failed"
❌ "Error: listen EADDRINUSE"
```

**MongoDB:**
```bash
# Look for:
✅ "Waiting for connections"
❌ "Error initializing database"
```

### 3. Verify Service Dependencies

Services must start in this order:
1. MongoDB (must be healthy first)
2. Redis (must be healthy)
3. MinIO (must be healthy)
4. Backend (waits for MongoDB, Redis, MinIO)
5. Frontend (waits for Backend)

Check if services are waiting for dependencies:
```bash
# In backend logs, look for:
"MongoDB connection failed"
"Waiting for MongoDB..."
```

### 4. Check Port Configuration

Verify ports are correctly exposed:

**In docker-compose.yaml:**
- Frontend: `3000:3000`
- Backend: `3001:3001`

**In Coolify:**
- Frontend service should expose port `3000`
- Backend service should expose port `3001`

### 5. Check Environment Variables

Verify these are set in Coolify:

```bash
# Required for Backend
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Required for Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Common Issues & Fixes

### Issue 1: Containers Not Starting

**Symptoms:**
- Containers show as "Stopped" or "Restarting"
- Logs show startup errors

**Fix:**
1. Check logs for specific errors
2. Verify Dockerfiles exist (`backend/Dockerfile`, `frontend/Dockerfile`)
3. Check if build succeeded
4. Verify environment variables are set

### Issue 2: Health Checks Failing

**Symptoms:**
- Containers are "Running" but not "Healthy"
- Services can't connect to each other

**Fix:**
1. Wait longer (health checks have start periods)
2. Check if services are actually listening on ports
3. Verify network connectivity between containers
4. Check if MongoDB/Redis are accessible

### Issue 3: Port Conflicts

**Symptoms:**
- "Error: listen EADDRINUSE"
- Container starts then immediately stops

**Fix:**
1. Check if ports 3000, 3001 are already in use
2. In Coolify, verify port mappings
3. Restart the deployment

### Issue 4: MongoDB Connection Failed

**Symptoms:**
- Backend logs show "MongoDB connection failed"
- Backend keeps restarting

**Fix:**
1. Verify MongoDB container is running and healthy
2. Check `MONGODB_URI` is correct: `mongodb://mongo:27017/bizabode`
3. Wait for MongoDB to be fully ready (30+ seconds)
4. Check MongoDB logs for errors

### Issue 5: Frontend Can't Reach Backend

**Symptoms:**
- Frontend loads but API calls fail
- CORS errors in browser console

**Fix:**
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is healthy and accessible
3. Verify CORS configuration in backend
4. Check network connectivity between containers

## Step-by-Step Recovery

### Step 1: Check All Container Status

```bash
# In Coolify, go to Containers tab
# Verify all are "Running" and "Healthy"
```

### Step 2: Check Logs in Order

1. **MongoDB logs** - Should show "Waiting for connections"
2. **Redis logs** - Should show "Ready to accept connections"
3. **MinIO logs** - Should show "Browser Access"
4. **Backend logs** - Should show "Server running" and "MongoDB connected"
5. **Frontend logs** - Should show "Ready on http://0.0.0.0:3000"

### Step 3: Restart Services

If containers are unhealthy:

1. In Coolify, click **"Restart"** on each service
2. Start with MongoDB, then Redis, MinIO, Backend, Frontend
3. Wait for each to be healthy before starting the next

### Step 4: Rebuild if Needed

If issues persist:

1. In Coolify, click **"Rebuild"**
2. Select **"No Cache"** option
3. Wait for build to complete
4. Check logs after rebuild

## Quick Test Commands

If you can access the containers:

**Test Frontend:**
```bash
curl http://localhost:3000
# Should return HTML or 200 status
```

**Test Backend:**
```bash
curl http://localhost:3001/healthz
# Should return {"status":"ok"}
```

**Test MongoDB:**
```bash
# From backend container
mongosh mongodb://mongo:27017/bizabode
# Should connect successfully
```

## Still Not Working?

1. **Check Coolify logs** - Look for deployment errors
2. **Verify repository** - Ensure `docker-compose.yaml` is in root
3. **Check resources** - Ensure server has enough RAM/CPU
4. **Review network** - Verify containers are on same network
5. **Check Coolify version** - Ensure you're on latest version

## Prevention

To avoid 502 errors:

1. ✅ Always wait for health checks to pass
2. ✅ Set environment variables before deployment
3. ✅ Verify Dockerfiles exist and are correct
4. ✅ Check service dependencies are correct
5. ✅ Monitor logs during first deployment



