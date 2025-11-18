# Bizabode Accounting Suite - Troubleshooting Guide

## 🚨 **ERR_CONNECTION_REFUSED - Solutions**

### **Problem**: `localhost refused to connect`

This means the services aren't running yet. Here are the solutions:

## 🔧 **Solution 1: Docker Setup (Recommended)**

### **Step 1: Install Docker Desktop**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Wait for Docker to start (green icon in system tray)

### **Step 2: Start Services**
```bash
# Check Docker is running
docker --version

# Start all services
docker-compose up -d

# Wait for services to start (30-60 seconds)
# Then check status
docker-compose ps
```

### **Step 3: Seed Database**
```bash
# Seed with sample data
docker-compose exec backend npm run seed
```

### **Step 4: Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🔧 **Solution 2: Local Development (No Docker)**

If Docker isn't available, run the services locally:

### **Step 1: Install Prerequisites**
```bash
# Install Node.js (v18+)
# Download from: https://nodejs.org/

# Install MongoDB locally
# Download from: https://www.mongodb.com/try/download/community

# Install Redis (optional, for background jobs)
# Download from: https://redis.io/download
```

### **Step 2: Start MongoDB**
```bash
# Start MongoDB service
# Windows: Start MongoDB service from Services
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### **Step 3: Start Backend**
```bash
cd backend
npm install
npm run dev
```

### **Step 4: Start Frontend (New Terminal)**
```bash
cd frontend
npm install
npm run dev
```

## 🔧 **Solution 3: Quick Start Script**

I've created startup scripts for you:

### **Windows:**
```bash
# Run the batch file
start-local.bat
```

### **Mac/Linux:**
```bash
# Make executable and run
chmod +x start-local.sh
./start-local.sh
```

## 🔍 **Diagnostic Commands**

### **Check What's Running:**
```bash
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :27017
netstat -ano | findstr :6379

# Check Docker containers
docker ps

# Check Docker Compose services
docker-compose ps
```

### **Check Service Logs:**
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Docker Not Running**
**Error**: `docker: command not found`
**Solution**: Install Docker Desktop and start it

### **Issue 2: Port Already in Use**
**Error**: `Port 3000 is already in use`
**Solution**: 
```bash
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

### **Issue 3: MongoDB Connection Failed**
**Error**: `MongoDB connection failed`
**Solution**:
```bash
# Check MongoDB container
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

### **Issue 4: Frontend Build Failed**
**Error**: `Frontend build failed`
**Solution**:
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### **Issue 5: Backend API Not Responding**
**Error**: `Backend API not responding`
**Solution**:
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

## 🎯 **Step-by-Step Recovery**

### **If Nothing is Working:**

1. **Stop Everything:**
   ```bash
   docker-compose down
   docker system prune -f
   ```

2. **Start Fresh:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for Services:**
   ```bash
   # Wait 60 seconds for all services to start
   sleep 60
   ```

4. **Check Status:**
   ```bash
   docker-compose ps
   ```

5. **Seed Database:**
   ```bash
   docker-compose exec backend npm run seed
   ```

6. **Test Endpoints:**
   ```bash
   # Test backend
   curl http://localhost:3001/healthz
   
   # Test frontend
   curl http://localhost:3000
   ```

## 📞 **Getting Help**

### **Check Service Status:**
```bash
# All services should show "Up" status
docker-compose ps
```

### **Expected Output:**
```
Name                    Command               State           Ports
bizabode-backend        npm run dev           Up      0.0.0.0:3001->3001/tcp
bizabode-frontend       npm run dev           Up      0.0.0.0:3000->3000/tcp
bizabode-mongo          docker-entrypoint.sh  Up      0.0.0.0:27017->27017/tcp
bizabode-redis          docker-entrypoint.sh  Up      0.0.0.0:6379->6379/tcp
bizabode-worker         npm run worker        Up
```

### **If Services Are Down:**
```bash
# Restart all services
docker-compose restart

# Or restart specific service
docker-compose restart backend
docker-compose restart frontend
```

## 🚀 **Alternative: Manual Start**

If Docker continues to have issues, you can run the services manually:

### **1. Start MongoDB:**
```bash
# Install MongoDB locally
# Start MongoDB service
```

### **2. Start Backend:**
```bash
cd backend
npm install
npm run dev
```

### **3. Start Frontend (New Terminal):**
```bash
cd frontend
npm install
npm run dev
```

### **4. Seed Database:**
```bash
cd backend
npm run seed
```

## 🎉 **Success Indicators**

When everything is working, you should see:

1. **Backend**: http://localhost:3001/healthz returns `{"status":"ok"}`
2. **Frontend**: http://localhost:3000 shows the login page
3. **Database**: Sample data is loaded
4. **Login**: You can login with `owner@jamaicatech.com` / `password123`

**The system is fully functional when all these work!**


















