# Production Setup Guide

## Clean Docker Compose Setup

This setup uses a simple docker-compose configuration similar to local development but optimized for production.

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in the root directory with your production values:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# MinIO S3 Configuration (if using)
S3_ENDPOINT=http://minio:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

### 2. Build and Start

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (⚠️ deletes database)
docker-compose -f docker-compose.prod.yml down -v
```

## Services

### Frontend (Port 3000)
- Next.js production build
- Connects to backend via internal Docker network
- Uses Next.js API proxy route for `/api/*` requests

### Backend (Port 3001)
- Express.js API server
- Connects to MongoDB
- Health check endpoint: `/healthz`

### MongoDB (Port 27017)
- Database with persistent volume
- Data stored in `mongo_data` volume

## Architecture

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
```

## How It Works

1. **Frontend** serves the Next.js application on port 3000
2. **API Requests** from frontend go to `/api/*` routes
3. **Next.js API Proxy** (`frontend/src/app/api/[...path]/route.ts`) forwards requests to backend
4. **Backend** processes requests and connects to MongoDB
5. **MongoDB** stores all data persistently

## Environment Variables

### Required for Backend
- `JWT_SECRET` - Secret key for JWT tokens
- `MONGODB_URI` - MongoDB connection string (auto-set to `mongodb://mongo:27017/bizabode`)
- `FRONTEND_URL` - Frontend URL for CORS

### Required for Frontend (Build Time)
- `NEXT_PUBLIC_API_URL` - Public API URL (used at build time)
- `NEXT_PUBLIC_APP_URL` - Public app URL (used at build time)

### Required for Frontend (Runtime)
- `BACKEND_URL` - Internal backend URL (auto-set to `http://backend:3001`)

## Deployment in Coolify

1. **Upload docker-compose.prod.yml** to Coolify
2. **Set environment variables** in Coolify UI
3. **Configure domains:**
   - Frontend: `yourdomain.com` → `frontend:3000`
   - Backend API: `api.yourdomain.com` → `backend:3001` (optional, if using direct API calls)

4. **Deploy** and Coolify will handle the rest

## Health Checks

All services have health checks:

- **Frontend**: `http://localhost:3000` (HTTP 200)
- **Backend**: `http://localhost:3001/healthz` (HTTP 200)
- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"`

## Troubleshooting

### Frontend can't connect to backend
- Check `BACKEND_URL` is set to `http://backend:3001`
- Verify both services are on the same network (`bizabode-network`)
- Check backend logs: `docker-compose -f docker-compose.prod.yml logs backend`

### Backend can't connect to MongoDB
- Check MongoDB is healthy: `docker-compose -f docker-compose.prod.yml ps`
- Verify `MONGODB_URI` is `mongodb://mongo:27017/bizabode`
- Check MongoDB logs: `docker-compose -f docker-compose.prod.yml logs mongo`

### Build fails
- Check environment variables are set correctly
- Verify `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are set at build time
- Check build logs: `docker-compose -f docker-compose.prod.yml build --no-cache frontend`

## Database Persistence

MongoDB data is stored in a Docker volume (`mongo_data`). To backup:

```bash
# Create backup
docker run --rm -v bizabode-mongo-prod_mongo_data:/data -v $(pwd):/backup mongo:7.0 tar czf /backup/mongo-backup.tar.gz /data

# Restore backup
docker run --rm -v bizabode-mongo-prod_mongo_data:/data -v $(pwd):/backup mongo:7.0 tar xzf /backup/mongo-backup.tar.gz -C /
```

## Clean Restart

To completely reset everything:

```bash
# Stop and remove everything including volumes
docker-compose -f docker-compose.prod.yml down -v

# Rebuild and start fresh
docker-compose -f docker-compose.prod.yml up -d --build
```
