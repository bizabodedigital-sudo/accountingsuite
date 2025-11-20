# Simple User Creation - Direct MongoDB Approach

This script bypasses Mongoose models and works directly with MongoDB. It will work regardless of database name.

**Run in Coolify Backend Terminal:**

```bash
cd /app
node src/scripts/quick-create-user.js
```

**What it does:**
- ✅ Connects directly to MongoDB (works with any database name)
- ✅ Creates tenant if needed
- ✅ Creates user with hashed password
- ✅ Verifies password works
- ✅ Shows clear output

This is the most direct approach - no model dependencies, just raw MongoDB operations.

