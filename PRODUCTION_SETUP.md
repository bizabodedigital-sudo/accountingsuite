# Production Setup Checklist

## ✅ Completed

- [x] Removed local environment files (backend/env.local, frontend/env.local)
- [x] Created production docker-compose.yml (docker-compose.prod.yml)
- [x] Updated .gitignore to exclude all env files
- [x] Created database seed scripts
- [x] Created deployment documentation
- [x] Updated README with production deployment info
- [x] Removed local-specific paths from docker-compose
- [x] All code pushed to GitHub: https://github.com/bizabodedigital-sudo/accountingsuite

## 📋 Next Steps for Coolify Deployment

### 1. Environment Variables Setup

In Coolify, configure these environment variables for each service:

#### Backend Service
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-domain.com
S3_ENDPOINT=https://your-s3-endpoint.com
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=<your-key>
S3_SECRET_KEY=<your-secret>
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
SMTP_HOST=<optional>
SMTP_PORT=587
SMTP_USER=<optional>
SMTP_PASS=<optional>
LOG_LEVEL=info
```

#### Frontend Service
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Seeding

After deployment, run the seed script:

```bash
# Option 1: Using the Node script
node scripts/seed-database.js

# Option 2: Using the shell script
bash scripts/seed-database.sh

# Option 3: Direct backend script
cd backend && node src/scripts/seed.js
```

### 3. Default Login Credentials

After seeding, use these credentials (⚠️ CHANGE IMMEDIATELY):

- **Owner**: owner@jamaicatech.com / password123
- **Accountant**: accountant@jamaicatech.com / password123
- **Staff**: staff@jamaicatech.com / password123

### 4. Features Included

✅ All new features are included:
- Tax calculation (Jamaican GCT)
- User roles & permissions
- Auto backup and recovery
- Email options
- Multi-currency support
- Document upload and save
- Inventory management
- Comprehensive settings system

### 5. API Endpoints

All API endpoints are production-ready:
- `/api/auth/*` - Authentication
- `/api/invoices/*` - Invoice management
- `/api/customers/*` - Customer management
- `/api/products/*` - Product management
- `/api/expenses/*` - Expense management
- `/api/settings/*` - Settings management
- `/api/tax/*` - Tax calculations
- `/api/backup/*` - Backup & restore
- `/api/documents/*` - Document management
- `/api/currencies/*` - Currency management
- `/api/inventory/*` - Inventory management

## 🔒 Security Notes

1. **JWT Secret**: Generate a strong secret (minimum 32 characters)
   ```bash
   openssl rand -base64 32
   ```

2. **Database**: Use strong MongoDB credentials in production

3. **S3 Storage**: Use production S3 credentials (not MinIO defaults)

4. **HTTPS**: Ensure SSL/HTTPS is enabled in Coolify

5. **Environment Variables**: Never commit .env files to Git

## 📚 Documentation

- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **New Features**: See [NEW_FEATURES.md](./NEW_FEATURES.md)
- **Feature Locations**: See [FEATURE_LOCATIONS.md](./FEATURE_LOCATIONS.md)

## 🐛 Troubleshooting

If you encounter issues:

1. Check Coolify logs for each service
2. Verify all environment variables are set
3. Ensure MongoDB and Redis are accessible
4. Check network connectivity between services
5. Verify S3 credentials are correct

## 📞 Support

For deployment assistance, refer to the deployment documentation or contact the development team.

