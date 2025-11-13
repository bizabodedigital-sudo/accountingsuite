# Bizabode Accounting Suite - Local Setup Guide

## 🚀 **Running Locally - Complete Instructions**

### **Option 1: Docker Compose (Recommended)**

```bash
# 1. Start all services
docker-compose up -d

# 2. Check services are running
docker-compose ps

# 3. Seed the database with sample data
docker-compose exec backend npm run seed

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### **Option 2: Local Development (Without Docker)**

```bash
# 1. Start infrastructure services only
docker-compose up mongo redis -d

# 2. Backend setup
cd backend
npm install
cp env.local .env
npm run dev

# 3. Frontend setup (in new terminal)
cd frontend
npm install
cp env.local .env.local
npm run dev

# 4. Seed database
cd backend
npm run seed
```

### **Option 3: Development with Hot Reload**

```bash
# Use development Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

## 🔧 **Environment Setup**

### **Root Environment Variables**
Create `.env` file in root directory:
```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/bizabode?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret_jwt_key_for_development
JWT_EXPIRES_IN=1h
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Backend Environment**
The backend already has `env.local` file configured.

### **Frontend Environment**
The frontend already has `env.local` file configured.

## 📊 **Service URLs**

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js application |
| **Backend API** | http://localhost:3001 | Express API server |
| **MongoDB** | mongodb://localhost:27017 | Database |
| **Redis** | redis://localhost:6379 | Cache & Queue |

## 🗄️ **Database Setup**

### **MongoDB Connection**
- **Host**: localhost:27017
- **Database**: bizabode
- **Username**: admin
- **Password**: password123

### **Sample Data**
The system includes sample data:
- **Tenant**: Jamaica Tech Solutions
- **Users**: 
  - owner@jamaicatech.com (OWNER)
  - accountant@jamaicatech.com (ACCOUNTANT)
  - staff@jamaicatech.com (STAFF)
- **Customers**: 3 sample customers
- **Invoices**: 3 sample invoices
- **Expenses**: 4 sample expenses

## 🧪 **Testing the Setup**

### **1. Check Services**
```bash
# Check Docker containers
docker-compose ps

# Check MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker-compose exec redis redis-cli ping

# Check Backend API
curl http://localhost:3001/healthz

# Check Frontend
curl http://localhost:3000
```

### **2. Test API Endpoints**
```bash
# Health check
curl http://localhost:3001/healthz

# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","tenantName":"Test Company"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@jamaicatech.com","password":"password123"}'
```

### **3. Access Frontend**
1. Open http://localhost:3000
2. Login with: `owner@jamaicatech.com` / `password123`
3. Explore the dashboard and features

## 🔧 **Troubleshooting**

### **Common Issues**

**1. Port Already in Use**
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :27017
netstat -ano | findstr :6379

# Kill process if needed
taskkill /PID <PID> /F
```

**2. Docker Not Running**
```bash
# Start Docker Desktop
# Or install Docker if not installed
```

**3. MongoDB Connection Issues**
```bash
# Check MongoDB container
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

**4. Frontend Build Issues**
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

**5. Backend Issues**
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

## 📋 **Available Scripts**

### **Root Level**
```bash
npm run install:bmad    # Build and install all components
npm run dev            # Start development environment
npm run build          # Build all components
npm run start          # Start production environment
npm run stop           # Stop all containers
npm run clean          # Clean up containers and volumes
npm run logs           # View container logs
npm run test           # Run all tests
```

### **Backend**
```bash
cd backend
npm run dev           # Start with nodemon
npm run start         # Start production
npm run worker        # Start BullMQ worker
npm run seed          # Seed database
npm run test          # Run tests
```

### **Frontend**
```bash
cd frontend
npm run dev           # Start development
npm run build         # Build for production
npm run start         # Start production
npm run lint          # Lint code
```

## 🎯 **Quick Start Commands**

```bash
# 1. Start everything
docker-compose up -d

# 2. Wait for services to be ready (30 seconds)
sleep 30

# 3. Seed database
docker-compose exec backend npm run seed

# 4. Access application
# Open http://localhost:3000
# Login: owner@jamaicatech.com / password123
```

## 🚀 **Production Deployment**

```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d

# Or use the development setup for now
docker-compose up -d
```

## 📞 **Support**

If you encounter any issues:
1. Check the logs: `docker-compose logs`
2. Restart services: `docker-compose restart`
3. Check the troubleshooting section above
4. Verify all environment variables are set correctly

**The Bizabode Accounting Suite is ready to run locally!**













