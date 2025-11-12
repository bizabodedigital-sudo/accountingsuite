<!-- a1e5fe1f-0b9d-475d-ae31-0f7d849aff7e 064a5e76-2c9a-4e66-a755-24ebee4774c1 -->
# Fix Docker Cache and Run All Services

## Problem Summary

Docker is using cached layers with old syntax errors in frontend files. The fixes we made locally aren't being picked up by Docker's build process.

## Solution Approach

Run services locally without Docker for the application layer, using Docker only for databases (MongoDB and Redis).

## Implementation Steps

### 1. Verify Current Syntax Fixes

- Check `frontend/src/app/expenses/page.tsx` line 580-581
- Check `frontend/src/app/invoices/page.tsx` line 580-581  
- Check `frontend/src/app/reconciliation/page.tsx` line 454-455
- Check `frontend/src/app/reports/page.tsx` line 550
- Check `frontend/src/app/settings/page.tsx` line 353-354
- Ensure all files end with `);` and proper closing braces

### 2. Stop All Docker Services

- Run `docker-compose down` to stop everything
- Clear any running processes on ports 3000, 3001

### 3. Start Database Services Only

- Run `docker-compose up mongo redis -d`
- Verify MongoDB is running on port 27017
- Verify Redis is running on port 6379

### 4. Start Backend Service Locally

- Navigate to `backend/` directory
- Ensure `.env` file exists (copy from `env.local`)
- Run `npm start` in background
- Verify backend is accessible at `http://localhost:3001/healthz`

### 5. Start Frontend Service Locally  

- Navigate to `frontend/` directory
- Ensure `.env.local` file exists (copy from `env.local`)
- Run `npm run dev` in background
- Verify frontend is accessible at `http://localhost:3000`

### 6. Seed Database

- Navigate to `backend/` directory
- Run `npm run seed` to populate with sample data

### 7. Verify All Services

- Test MongoDB connection via Compass: `mongodb://admin:password123@localhost:27017/bizabode?authSource=admin`
- Test backend API: `http://localhost:3001/healthz`
- Test frontend: `http://localhost:3000`
- Provide login credentials: `owner@jamaicatech.com` / `password123`

## Key Files

- `backend/env.local` - Backend environment configuration
- `frontend/env.local` - Frontend environment configuration
- `backend/src/config/database.js` - Database connection (already fixed)
- Frontend page files - Syntax errors (already fixed)

### To-dos

- [ ] Verify all frontend syntax fixes are correct
- [ ] Stop all Docker services and clear processes
- [ ] Start MongoDB and Redis with Docker
- [ ] Start backend service locally
- [ ] Start frontend service locally
- [ ] Seed database with sample data
- [ ] Verify all services are running and accessible