# Clean Minimal Setup Guide

## What's Included

✅ **MongoDB** - Database only  
✅ **Backend** - API server  
✅ **Frontend** - Next.js app  

❌ **No Redis** - Removed (not essential)  
❌ **No MinIO** - Removed (not essential)  
❌ **No Workers** - Removed (not essential)  
❌ **No Mongo Express** - Removed (not essential)  

## Required Environment Variables

Set these in **Coolify** → Your Docker Compose Resource → **Environment Variables**:

### Required:
```
JWT_SECRET=your-secret-key-minimum-32-characters
FRONTEND_URL=https://accountingsuites.bizabodeserver.org
NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org
```

### Optional:
```
JWT_EXPIRES_IN=24h
```

## Build Arguments (Frontend)

In Coolify → Frontend Service → **Build Arguments**:

```
NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org
```

## Deployment Steps

1. **Set Environment Variables** in Coolify (see above)
2. **Set Build Arguments** for frontend (see above)
3. **Deploy** - Coolify will build and start all services
4. **Wait** for all services to be healthy:
   - MongoDB: ~30 seconds
   - Backend: ~40 seconds (after MongoDB)
   - Frontend: ~60 seconds (after Backend)

## How It Works

```
Frontend (Port 3000)
    ↓
    Uses /api/* → Next.js Proxy
    ↓
Backend (Port 3001)
    ↓
MongoDB (Port 27017)
```

## Troubleshooting

### If Backend Won't Start:
- Check `JWT_SECRET` is set
- Check MongoDB is healthy
- Check backend logs

### If Frontend Won't Start:
- Check backend is healthy (frontend waits for it)
- Check `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are set
- Check frontend build logs

### If 502 Error:
- Wait 2-3 minutes for all services to start
- Check all services are "Running" and "Healthy"
- Check frontend logs for "Ready on http://0.0.0.0:3000"

## That's It!

This is the simplest possible setup. No extra services, no complex configurations - just what you need to run the app.

