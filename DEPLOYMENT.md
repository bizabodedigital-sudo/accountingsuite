# Bizabode Accounting Suite - Production Deployment Guide

## Overview
This guide covers deploying the Bizabode Accounting Suite to production using Coolify.

## Prerequisites
- Coolify instance set up
- MongoDB database (or use MongoDB service in Coolify)
- Redis instance (or use Redis service in Coolify)
- S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO, etc.)
- Domain name configured

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379

# JWT Configuration (Generate: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=24h

# Server Configuration
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Storage Configuration
S3_ENDPOINT=https://your-s3-endpoint.com
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Logging
LOG_LEVEL=info
```

## Coolify Deployment Steps

### 1. Connect Repository
1. In Coolify, create a new application
2. Connect to GitHub repository: `bizabode-digital-sudo/accountingsuite`
3. Select the `main` branch

### 2. Configure Services

#### Backend Service
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && node src/app.js`
- **Port**: `3001`
- **Environment Variables**: Add all backend variables from `.env`

#### Frontend Service
- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `cd frontend && npm start`
- **Port**: `3000`
- **Environment Variables**: 
  - `NEXT_PUBLIC_API_URL` (your backend API URL)
  - `NEXT_PUBLIC_APP_URL` (your frontend URL)

#### MongoDB Service
- Use Coolify's MongoDB service or external MongoDB
- Update `MONGODB_URI` in backend environment variables

#### Redis Service
- Use Coolify's Redis service or external Redis
- Update `REDIS_URL` in backend environment variables

### 3. Database Seeding

After deployment, seed the database:

```bash
# SSH into backend container or use Coolify's terminal
cd backend
node src/scripts/seed.js
```

This will create:
- Sample tenant (Jamaica Tech Solutions)
- 3 users (owner, accountant, staff)
- 6 customers
- 13 products
- 5 invoices
- 10 expenses

**Default Login Credentials:**
- Owner: `owner@jamaicatech.com` / `password123`
- Accountant: `accountant@jamaicatech.com` / `password123`
- Staff: `staff@jamaicatech.com` / `password123`

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

### 4. Health Checks

The application includes health check endpoints:
- Backend: `GET /health`
- Frontend: `GET /api/health`

Configure these in Coolify for automatic restart on failure.

## Production Checklist

- [ ] All environment variables configured
- [ ] Database seeded with initial data
- [ ] Default passwords changed
- [ ] SSL/HTTPS enabled
- [ ] Domain configured
- [ ] S3 storage configured and tested
- [ ] Email service configured (optional)
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Logs configured

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify JWT_SECRET is set and at least 32 characters
- Check logs in Coolify

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

### Database connection issues
- Verify MongoDB URI format
- Check network connectivity between services
- Ensure MongoDB is accessible from backend container

## Support

For issues or questions, contact the development team.

