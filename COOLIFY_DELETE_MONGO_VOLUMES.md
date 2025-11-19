# 🗑️ Delete MongoDB Volumes in Coolify

## Problem

Coolify doesn't always show a "Delete" button for volumes. Here are alternative ways to delete MongoDB volumes.

---

## ✅ Option 1: Delete MongoDB Service (Easiest)

**In Coolify:**

1. **Stop all services** in your Docker Compose resource
2. **Remove/Delete the `mongo` service:**
   - Go to your Docker Compose resource
   - Find the `mongo` service
   - Click **Remove** or **Delete** (not just Stop)
   - This should remove associated volumes automatically
3. **Redeploy** the Docker Compose resource
   - MongoDB will be recreated with new credentials

---

## ✅ Option 2: Use Terminal/SSH (If Available)

**If you have SSH access to your Coolify server:**

1. **SSH into your server:**
   ```bash
   ssh user@your-coolify-server
   ```

2. **List MongoDB volumes:**
   ```bash
   docker volume ls | grep mongo
   ```

3. **Delete the volumes:**
   ```bash
   # Delete main data volume
   docker volume rm mongodb-db-ckgcgko44wgc88swskc0gwg4
   
   # Delete config volume
   docker volume rm mongodb-configdb-ckgcgko44wgc88swskc0gwg4
   ```

4. **If volumes are in use, stop containers first:**
   ```bash
   # Find MongoDB container
   docker ps | grep mongo
   
   # Stop and remove MongoDB container
   docker stop <mongo-container-id>
   docker rm <mongo-container-id>
   
   # Then delete volumes
   docker volume rm mongodb-db-ckgcgko44wgc88swskc0gwg4
   docker volume rm mongodb-configdb-ckgcgko44wgc88swskc0gwg4
   ```

5. **Redeploy in Coolify**

---

## ✅ Option 3: Recreate Entire Docker Compose Resource

**If you can't delete individual services:**

1. **In Coolify:**
   - Go to your Docker Compose resource
   - Click **Settings** or **Configuration**
   - Look for **Delete Resource** or **Remove Resource**
   - Delete the entire resource (this removes all volumes)

2. **Recreate the resource:**
   - Create a new Docker Compose resource
   - Use the same `docker-compose.coolify.yml` file
   - Set environment variables with new MongoDB credentials
   - Deploy

---

## ✅ Option 4: Update MongoDB User (Keep Data)

**If you can't delete volumes and want to keep data:**

1. **Connect to MongoDB container via Coolify:**
   - Go to MongoDB service → **Terminal** or **Console**
   - Or use SSH if available

2. **Connect to MongoDB:**
   ```bash
   # If MongoDB has no auth (current state)
   mongosh
   
   # Or if it has old credentials, use those
   mongosh -u old-username -p old-password --authenticationDatabase admin
   ```

3. **Update or create user:**
   ```javascript
   use admin
   
   // Check existing users
   db.getUsers()
   
   // Update existing user password (if user exists)
   db.changeUserPassword("Bizabodeaccounting", "BizabodeD1!")
   
   // OR create new user (if user doesn't exist)
   db.createUser({
     user: "Bizabodeaccounting",
     pwd: "BizabodeD1!",
     roles: [ { role: "root", db: "admin" } ]
   })
   
   // Verify
   db.auth("Bizabodeaccounting", "BizabodeD1!")
   // Should return: { ok: 1 }
   
   exit
   ```

4. **Update MONGODB_URI in Coolify:**
   ```
   MONGODB_URI=mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin
   ```

5. **Restart backend service**

---

## ✅ Option 5: Use Docker Compose Down (If You Have Access)

**If you can access the server terminal:**

1. **Navigate to your project directory:**
   ```bash
   cd /path/to/your/project
   ```

2. **Stop and remove containers with volumes:**
   ```bash
   docker-compose -f docker-compose.coolify.yml down -v
   ```
   The `-v` flag removes volumes

3. **Redeploy in Coolify**

---

## 🎯 Recommended Approach

**For most users:**

1. **Try Option 1 first** (Delete MongoDB service in Coolify)
   - Simplest and safest
   - Coolify handles volume cleanup

2. **If that doesn't work, try Option 4** (Update MongoDB user)
   - Keeps your data
   - No volume deletion needed

3. **If you have SSH access, use Option 2** (Terminal commands)
   - Most control
   - Can verify volumes are deleted

---

## 🔍 Verify Volumes Are Deleted

**After deletion, verify:**

```bash
docker volume ls | grep mongo
```

**Should return nothing** (or only new volumes after redeploy)

---

## ⚠️ Important Notes

- **Backup first** if you have important data
- **Stop all services** before deleting volumes
- **Set environment variables** before redeploying
- **MongoDB will recreate volumes** on next deployment

---

## 🆘 Still Can't Delete?

**If none of these options work:**

1. **Check Coolify version** - Newer versions might have different UI
2. **Check permissions** - You might need admin access
3. **Contact Coolify support** - They can help with volume management
4. **Use Option 4** - Update user instead of deleting volumes (safest)

---

## ✅ After Deleting Volumes

**Make sure environment variables are set:**

```env
MONGO_ROOT_USERNAME=Bizabodeaccounting
MONGO_ROOT_PASSWORD=BizabodeD1!
MONGO_DATABASE=bizabode
MONGODB_URI=mongodb://Bizabodeaccounting:BizabodeD1%21@mongo:27017/bizabode?authSource=admin
```

**Then redeploy and verify:**

- Backend logs: `✅ MongoDB connected: mongo`
- Healthcheck: `{"mongo": "connected"}`

