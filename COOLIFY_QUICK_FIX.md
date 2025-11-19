# 🚀 Coolify Quick Fix Guide

## ⚡ Immediate Actions Required

### Step 1: Set JWT_SECRET (CRITICAL - Backend Won't Start Without This)

1. Go to Coolify → Your Project → **Shared Variables**
2. Click **Add Variable**
3. Set:
   - **Key**: `JWT_SECRET`
   - **Value**: `SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=`
4. Click **Save**

### Step 2: Set Other Critical Variables

Add these variables in Coolify Shared Variables:

```env
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

**Replace:**
- `your-frontend-domain.com` → Your actual frontend domain from Coolify
- `your-backend-domain.com` → Your actual backend domain from Coolify

### Step 3: Check Frontend Service

1. Go to your Docker Compose resource in Coolify
2. Scroll through the services list
3. **Verify "frontend" service exists** and is enabled/selected
4. If frontend is missing:
   - Check Docker Compose file is set to `docker-compose.coolify.yml`
   - Redeploy the Docker Compose resource
   - Make sure all services are selected during deployment

### Step 4: Redeploy

1. **Stop** all services
2. **Redeploy** the Docker Compose resource
3. Wait for services to start:
   - MongoDB should start first
   - Redis should start
   - Backend should start (once JWT_SECRET is set)
   - Frontend should start after backend is healthy

---

## 🔍 Why Frontend Isn't Showing

The frontend service has a dependency on backend being healthy:

```yaml
depends_on:
  backend:
    condition: service_healthy
```

**This means:**
- Frontend won't start until backend is healthy
- Backend won't be healthy until JWT_SECRET is set
- Once backend starts successfully, frontend will automatically start

**If frontend still doesn't appear:**

1. **Check if it's in the service list** (might be waiting)
2. **Check build logs** for frontend (might be failing to build)
3. **Check if build arguments are set** (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL)

---

## ✅ Success Indicators

After fixing, you should see:

1. **Backend logs**: No more "Missing required environment variables: JWT_SECRET"
2. **Backend logs**: "✅ Server running in production mode on port 3001"
3. **Frontend service**: Appears in Coolify service list
4. **Frontend logs**: Shows Next.js build process or server starting
5. **All services**: Show as "Running" in Coolify

---

## 🆘 Still Having Issues?

1. **Check all environment variables** are set (see `COOLIFY_ENV_VARS.md`)
2. **Verify Docker Compose file** is `docker-compose.coolify.yml`
3. **Check build logs** for each service
4. **Verify service dependencies** are correct
5. **Check Coolify logs** for any errors

---

## 📋 Quick Checklist

- [ ] JWT_SECRET is set in Coolify Shared Variables
- [ ] MONGODB_URI is set
- [ ] REDIS_URL is set
- [ ] FRONTEND_URL is set
- [ ] NEXT_PUBLIC_API_URL is set
- [ ] NEXT_PUBLIC_APP_URL is set
- [ ] Frontend service exists in Docker Compose
- [ ] All services redeployed
- [ ] Backend logs show "Server running"
- [ ] Frontend appears in service list

