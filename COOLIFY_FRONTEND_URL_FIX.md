# 🔧 Fixing localhost:3000 URLs in Frontend

## ❌ Problem: Frontend Showing localhost URLs

The frontend is displaying or using `localhost:3000` or `localhost:3001` URLs instead of your actual domain.

## 🔍 Root Cause

**Next.js embeds `NEXT_PUBLIC_*` environment variables at BUILD TIME**, not runtime. If these weren't set during the build, the frontend will use fallback localhost URLs.

## ✅ Solution

### Step 1: Set Environment Variables in Coolify

Go to Coolify → Your Project → **Shared Variables** and ensure these are set:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

**Important:** Replace with your actual Coolify domains:
- `your-backend-domain.com` → Your actual backend domain (e.g., `api.accountingsuite.bizabodeserver.org`)
- `your-frontend-domain.com` → Your actual frontend domain (e.g., `accountingsuite.bizabodeserver.org`)

### Step 2: Verify Build Arguments in Docker Compose

The docker-compose file should pass these as build arguments:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
```

### Step 3: Rebuild Frontend

**Critical:** After setting environment variables, you MUST rebuild the frontend:

1. **Stop** the frontend service in Coolify
2. **Redeploy** the Docker Compose resource (or just the frontend service)
3. This will trigger a new build with the correct environment variables

### Step 4: Verify Build Logs

Check the frontend build logs in Coolify to verify:

1. Go to Frontend service → **Builds** tab
2. Look for build logs showing:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
   NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
   ```
3. If you see `localhost` in the build logs, the variables aren't being passed correctly

---

## 🔍 Where localhost URLs Appear

### 1. API Calls

The frontend uses `NEXT_PUBLIC_API_URL` for API calls. If not set, it falls back to:
```typescript
window.location.origin.replace(':3000', ':3001') // Falls back to localhost:3001
```

**Fix:** Set `NEXT_PUBLIC_API_URL` in Coolify Shared Variables and rebuild.

### 2. Redirects/URLs

If `NEXT_PUBLIC_APP_URL` isn't set, redirects might use localhost.

**Fix:** Set `NEXT_PUBLIC_APP_URL` in Coolify Shared Variables and rebuild.

### 3. Browser Console/Network Tab

If you see localhost URLs in:
- Browser console logs
- Network tab requests
- Error messages

This means the frontend was built with localhost URLs baked in.

**Fix:** Rebuild the frontend with correct environment variables.

---

## 🧪 Testing

After rebuilding:

1. **Check browser console:**
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
   ```
   Should show your actual domain, not localhost.

2. **Check network requests:**
   - Open browser DevTools → Network tab
   - Make an API call
   - Verify requests go to your backend domain, not localhost:3001

3. **Check page source:**
   - View page source (Ctrl+U)
   - Search for "localhost"
   - Should not find any localhost URLs

---

## ⚠️ Common Mistakes

### Mistake 1: Setting Variables After Build

**Problem:** Setting `NEXT_PUBLIC_API_URL` after the frontend is already built.

**Solution:** Set variables BEFORE building, then rebuild.

### Mistake 2: Wrong Variable Names

**Problem:** Using `API_URL` instead of `NEXT_PUBLIC_API_URL`.

**Solution:** Must use `NEXT_PUBLIC_*` prefix for Next.js to embed them.

### Mistake 3: Not Rebuilding

**Problem:** Just restarting the container instead of rebuilding.

**Solution:** Must rebuild (not just restart) for Next.js to pick up new env vars.

### Mistake 4: Variables Not Available During Build

**Problem:** Variables set at runtime but not during build.

**Solution:** Use `build.args` in docker-compose to pass variables during build.

---

## 📋 Quick Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set in Coolify Shared Variables
- [ ] `NEXT_PUBLIC_APP_URL` is set in Coolify Shared Variables
- [ ] Variables use your actual domains (not localhost)
- [ ] Docker Compose has `build.args` for these variables
- [ ] Frontend service has been **rebuilt** (not just restarted)
- [ ] Build logs show correct URLs (not localhost)
- [ ] Browser console shows correct API URL
- [ ] Network requests go to correct domain

---

## 🚀 After Fixing

Once rebuilt with correct variables:

- ✅ API calls will go to your backend domain
- ✅ Redirects will use your frontend domain
- ✅ No more localhost URLs in console/network
- ✅ Application works correctly in production

---

## 🆘 Still Seeing localhost?

1. **Clear browser cache** - Old JavaScript might be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check build logs** - Verify variables were passed during build
4. **Verify docker-compose** - Check `build.args` section
5. **Check Coolify** - Ensure variables are set at Project level

