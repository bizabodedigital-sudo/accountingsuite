# Test Backend API Login Directly

This bypasses the frontend and tests the backend API directly.

**Run in Coolify Backend Terminal:**

```bash
cd /app
node src/scripts/test-login-api.js
```

This will:
- ✅ Test the login API endpoint directly
- ✅ Show if backend is working correctly
- ✅ Verify database credentials are correct
- ✅ Show the JWT token if login succeeds

**If this works**, it confirms:
- Database is properly seeded ✅
- Backend API is working ✅
- The issue is only with the frontend (Turbopack chunks)

**If this fails**, it will show the exact error from the backend.

