# 🔧 Coolify Environment Variables Troubleshooting

## ❌ Problem: JWT_SECRET Still Not Working

If you're still seeing `ERROR: Missing required environment variables: JWT_SECRET` after setting it in Coolify, follow these steps:

---

## ✅ Step-by-Step Fix

### Step 1: Verify Variable Location in Coolify

**Important:** For Docker Compose resources, environment variables must be set at the **correct level**:

1. **Go to Coolify** → Your Project
2. **Click on your Docker Compose resource** (not individual services)
3. **Go to "Environment Variables" or "Shared Variables"** tab
4. **Make sure variables are set at the RESOURCE level**, not service level

### Step 2: Check Variable Name

The variable name must be **exactly** `JWT_SECRET` (case-sensitive):
- ✅ Correct: `JWT_SECRET`
- ❌ Wrong: `JWT_SECRET_KEY`, `jwt_secret`, `JwtSecret`

### Step 3: Verify Variable Value

1. **Click on the variable** in Coolify
2. **Check the value** - make sure it's not empty
3. **Make sure there are no extra spaces** before/after the value
4. **Use this value:**
   ```
   SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=
   ```

### Step 4: Check Variable Scope

In Coolify, environment variables can be set at different levels:

1. **Project Level** (Shared Variables) - ✅ Best for Docker Compose
2. **Resource Level** (Docker Compose resource) - ✅ Also works
3. **Service Level** - ❌ May not work for Docker Compose

**Recommendation:** Set variables at **Project Level** (Shared Variables) so all services can access them.

### Step 5: Redeploy After Setting Variables

**Critical:** After adding/changing environment variables:

1. **Stop** the Docker Compose resource
2. **Wait** a few seconds
3. **Redeploy** the resource
4. **DO NOT** just restart - you need to redeploy for env vars to be picked up

---

## 🔍 Alternative: Set Variables Directly in Docker Compose

If Coolify's environment variable system isn't working, you can temporarily hardcode the value in docker-compose (NOT recommended for production, but useful for testing):

### Option A: Use Default Value in docker-compose

Edit `docker-compose.coolify.yml`:

```yaml
environment:
  JWT_SECRET: ${JWT_SECRET:-SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=}
```

This will use the default value if `JWT_SECRET` is not set.

### Option B: Use .env File (if Coolify supports it)

Create a `.env` file in your repository root:

```env
JWT_SECRET=SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=
```

**⚠️ WARNING:** Don't commit `.env` files with secrets to git! Use `.gitignore`.

---

## 🧪 Testing if Variables Are Being Passed

### Method 1: Check Container Environment

1. In Coolify, go to your backend service
2. Open **Terminal** tab
3. Run: `env | grep JWT_SECRET`
4. If it shows the variable, it's being passed correctly
5. If it's empty or missing, the variable isn't being set

### Method 2: Check Docker Compose Logs

1. In Coolify, go to your Docker Compose resource
2. Check the **deployment logs**
3. Look for environment variable substitution messages
4. Check if `${JWT_SECRET}` is being replaced

### Method 3: Add Debug Logging

Temporarily add this to your backend code to see what's being received:

```javascript
console.log('JWT_SECRET value:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
```

---

## 🎯 Coolify-Specific Issues

### Issue 1: Variables Not Available During Build

**Symptom:** Variables work at runtime but not during build

**Solution:** 
- For build-time variables (like `NEXT_PUBLIC_*`), use `build.args` in docker-compose
- For runtime variables (like `JWT_SECRET`), use `environment` section

### Issue 2: Variables Set But Not Applied

**Symptom:** Variable is set in Coolify but container doesn't see it

**Solutions:**
1. **Redeploy** (don't just restart)
2. **Check variable scope** (Project/Resource level)
3. **Verify docker-compose syntax** - make sure `${VAR_NAME}` is correct
4. **Check for typos** in variable names

### Issue 3: Docker Compose Not Reading Variables

**Symptom:** docker-compose file references `${VAR}` but it's empty

**Solutions:**
1. Make sure variables are set **before** deploying
2. Use **Shared Variables** at Project level
3. Check Coolify's Docker Compose variable substitution settings
4. Try setting variables in Coolify's **Environment** section for the resource

---

## 📋 Quick Checklist

- [ ] Variable name is exactly `JWT_SECRET` (case-sensitive)
- [ ] Variable is set at **Project** or **Resource** level (not service level)
- [ ] Variable value is not empty
- [ ] Variable has no extra spaces
- [ ] Docker Compose resource has been **redeployed** (not just restarted)
- [ ] Checked container environment with `env | grep JWT_SECRET`
- [ ] Verified docker-compose.yml references `${JWT_SECRET}` correctly

---

## 🆘 Still Not Working?

If variables still aren't working:

1. **Check Coolify version** - older versions may have issues
2. **Try setting variables directly in docker-compose** (temporary workaround)
3. **Check Coolify logs** for variable substitution errors
4. **Contact Coolify support** or check their documentation
5. **Use Coolify's "Environment" tab** instead of "Shared Variables"

---

## 💡 Pro Tip

For Docker Compose in Coolify, the most reliable way is:

1. **Set variables at Project level** (Shared Variables)
2. **Reference them in docker-compose** as `${VAR_NAME}`
3. **Redeploy** after adding variables
4. **Check container logs** to verify they're being received

