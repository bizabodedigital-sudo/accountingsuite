# 🔧 Fix MongoDB Authentication Error

## ❌ Error

```
ERROR: ❌ MongoDB connection error: Authentication failed.
```

**Problem:** MongoDB was initialized with different credentials (or no credentials), and changing environment variables doesn't update existing users.

---

## 🔍 Root Cause

MongoDB only creates the root user when the database is **first initialized** (when `/data/db` is empty). If the MongoDB container was already running, the new credentials won't take effect.

---

## ✅ Solution Options

### Option 1: Recreate MongoDB Container (Recommended - Fresh Start)

**⚠️ WARNING:** This will **DELETE ALL DATA** in MongoDB. Only do this if:
- You don't have important data yet, OR
- You have backups, OR
- This is a fresh deployment

**Steps:**

1. **In Coolify → Your Docker Compose Resource:**

2. **Stop all services** (especially backend and worker that depend on MongoDB)

3. **Delete MongoDB volume:**
   - Go to **Volumes** tab
   - Find `mongo_data` volume
   - Click **Delete** or **Remove**
   - Confirm deletion

4. **Set environment variables in Coolify:**
   ```env
   MONGO_ROOT_USERNAME=Bizabodeaccounting
   MONGO_ROOT_PASSWORD=BizabodeD1!
   MONGO_DATABASE=bizabode
   MONGODB_URI=mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin
   ```

5. **Redeploy Docker Compose:**
   - MongoDB will initialize with new credentials
   - Backend will connect successfully

---

### Option 2: Update Existing MongoDB User (Keep Data)

**✅ Use this if you have existing data you want to keep.**

**Steps:**

1. **Connect to MongoDB container:**
   ```bash
   # In Coolify, go to MongoDB service → Terminal/Console
   # Or via SSH to your server:
   docker exec -it <mongo-container-name> mongosh
   ```

2. **Switch to admin database:**
   ```javascript
   use admin
   ```

3. **Check existing users:**
   ```javascript
   db.getUsers()
   ```

4. **Update or create root user:**
   ```javascript
   // If user exists, update password:
   db.changeUserPassword("Bizabodeaccounting", "BizabodeD1!")
   
   // OR if user doesn't exist, create it:
   db.createUser({
     user: "Bizabodeaccounting",
     pwd: "BizabodeD1!",
     roles: [ { role: "root", db: "admin" } ]
   })
   ```

5. **Verify connection:**
   ```javascript
   db.auth("Bizabodeaccounting", "BizabodeD1!")
   // Should return: { ok: 1 }
   ```

6. **Exit:**
   ```javascript
   exit
   ```

7. **Restart backend service** in Coolify

---

### Option 3: Create New User (Keep Data + Keep Old User)

**✅ Use this if you want to keep the old user and add a new one.**

**Steps:**

1. **Connect to MongoDB** (using old credentials or without auth if it was disabled)

2. **Create new user:**
   ```javascript
   use admin
   db.createUser({
     user: "Bizabodeaccounting",
     pwd: "BizabodeD1!",
     roles: [ { role: "root", db: "admin" } ]
   })
   ```

3. **Update MONGODB_URI** in Coolify to use new credentials

4. **Restart backend service**

---

## 🎯 Quick Fix (Recommended for Fresh Deployments)

**If you're okay losing data (fresh deployment):**

1. **In Coolify:**
   - Stop Docker Compose resource
   - Go to **Volumes** → Delete `mongo_data`
   - Set environment variables:
     ```
     MONGO_ROOT_USERNAME=Bizabodeaccounting
     MONGO_ROOT_PASSWORD=BizabodeD1!
     MONGODB_URI=mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin
     ```
   - Redeploy

2. **MongoDB will initialize with new credentials automatically**

---

## 🔍 Verify Environment Variables in Coolify

**Make sure these are set correctly:**

```env
# MongoDB Root Credentials
MONGO_ROOT_USERNAME=Bizabodeaccounting
MONGO_ROOT_PASSWORD=BizabodeD1!

# MongoDB Connection String (password URL-encoded: ! = %21)
MONGODB_URI=mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin

# Database Name
MONGO_DATABASE=bizabode
```

**Important:**
- Password in `MONGODB_URI` must be URL-encoded: `!` → `%21`
- `authSource=admin` is required for root user authentication

---

## 🧪 Test Connection

**After fixing, verify connection:**

1. **Check backend logs:**
   ```
   ✅ MongoDB connected: mongo
   ```

2. **Test via MongoDB shell:**
   ```bash
   docker exec -it <mongo-container> mongosh -u Bizabodeaccounting -p BizabodeD1! --authenticationDatabase admin
   ```

3. **Check database:**
   ```javascript
   show dbs
   use bizabode
   show collections
   ```

---

## 📋 Checklist

- [ ] Environment variables set in Coolify:
  - [ ] `MONGO_ROOT_USERNAME=Bizabodeaccounting`
  - [ ] `MONGO_ROOT_PASSWORD=BizabodeD1!`
  - [ ] `MONGODB_URI=mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin`
- [ ] MongoDB volume deleted (if recreating) OR user updated (if keeping data)
- [ ] MongoDB container restarted
- [ ] Backend service restarted
- [ ] Backend logs show: `✅ MongoDB connected: mongo`
- [ ] No more authentication errors

---

## 🆘 Still Not Working?

**If authentication still fails:**

1. **Check MongoDB logs:**
   ```bash
   # In Coolify → MongoDB service → Logs
   # Look for authentication errors
   ```

2. **Verify password encoding:**
   - In `MONGODB_URI`, `!` must be `%21`
   - Test with: `mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin`

3. **Check if MongoDB is using auth:**
   ```bash
   # Connect without auth (if it works, auth isn't enabled)
   docker exec -it <mongo-container> mongosh
   ```

4. **Try connecting with mongosh directly:**
   ```bash
   docker exec -it <mongo-container> mongosh \
     -u Bizabodeaccounting \
     -p BizabodeD1! \
     --authenticationDatabase admin
   ```

5. **Check environment variables are actually set:**
   ```bash
   # In MongoDB container
   docker exec -it <mongo-container> env | grep MONGO
   ```

---

## 💡 Pro Tip

**For future deployments:**
- Always set `MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD` **before** first deployment
- This ensures MongoDB initializes with correct credentials from the start
- Avoids needing to recreate volumes or update users manually

---

## ✅ Success Indicators

After fixing:

- ✅ Backend logs: `✅ MongoDB connected: mongo`
- ✅ No authentication errors
- ✅ Backend health check passes
- ✅ Application can read/write to database

