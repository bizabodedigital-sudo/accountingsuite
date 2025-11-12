<!-- 083ddf24-0c45-4849-aaf1-add343a4a2df ad9ff9fc-5e97-49cd-969a-0dcce522fb58 -->
# Rebuild Bizabode Accounting Suite with Docker Compose

## Overview

Create a single Docker Compose file to orchestrate all services (MongoDB, Redis, Backend, Frontend, Worker), delete existing data, and seed a fresh database.

## Implementation Steps

### 1. Stop and Clean Existing Infrastructure

- Stop all running Docker containers
- Remove existing volumes to ensure fresh database
- Clean up Docker system

### 2. Create Root .env File

Create `.env` in project root with S3 credentials:

```
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
```

### 3. Create Comprehensive docker-compose.yml

Create a single `docker-compose.yml` with all services:

- **MongoDB**: Port 27017, database `bizabode`, persistent volume
- **Redis**: Port 6379, persistent volume
- **Backend**: Port 3001, connects to `mongodb://mongo:27017/bizabode`
- **Frontend**: Port 3000, connects to backend via Docker network
- **Worker**: Background jobs, shares backend codebase

Key configurations:

- All services use `bizabode-network` bridge network
- Backend and worker use `MONGODB_URI: mongodb://mongo:27017/bizabode`
- Frontend uses `NEXT_PUBLIC_API_URL: http://localhost:3001` (for browser requests)
- Health checks on backend to ensure MongoDB is ready
- Volume mounts for hot-reloading in development

### 4. Build and Start Services

- Build all Docker images with `docker-compose up --build -d`
- Wait for services to be healthy (30 seconds)
- Verify all containers are running

### 5. Seed Fresh Database

- Execute seed script inside backend container: `docker exec -it bizabode-backend-dev node src/scripts/seed.js`
- Verify data was created successfully

### 6. Verify Application

- Test backend API endpoint
- Test authentication with seeded user
- Check database collections and document counts
- Verify frontend is accessible

## Files to Modify

- `docker-compose.yml` (create new)
- `.env` (create new in root)

## Expected Results

- All 5 services running in Docker
- Fresh MongoDB database with seeded data (1 tenant, 3 users, 3 customers, 3 invoices, 4 expenses)
- Frontend accessible at http://localhost:3000
- Backend API accessible at http://localhost:3001
- MongoDB accessible at localhost:27017

### To-dos

- [ ] Stop all Docker containers and remove volumes for fresh start
- [ ] Create .env file in project root with S3 credentials
- [ ] Create comprehensive docker-compose.yml with all 5 services
- [ ] Build and start all Docker services
- [ ] Execute seed script to populate fresh database
- [ ] Verify all services are working and data is accessible