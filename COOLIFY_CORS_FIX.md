# 🔧 Fix CORS Error in Coolify

## ❌ Error

```
Access to XMLHttpRequest at 'https://accountingsuite.bizabodeserver.org/api/auth/login' 
from origin 'https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Problem:** Frontend is on a different subdomain than what's configured in `FRONTEND_URL`, so CORS is blocking the request.

---

## 🔍 Root Cause

**Frontend domain:** `https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org`  
**FRONTEND_URL configured:** `https://accountingsuite.bizabodeserver.org`

Coolify sometimes uses preview/random subdomains for deployments, which don't match the configured `FRONTEND_URL`.

---

## ✅ Solution 1: Update CORS Configuration (Recommended)

**The backend code has been updated** to allow subdomains of the same base domain. This means:
- ✅ `q00w48cg484wggw80gw8o8k4.bizabodeserver.org` will be allowed if `FRONTEND_URL` is `accountingsuite.bizabodeserver.org`
- ✅ Both share the same base domain: `bizabodeserver.org`

**After redeploying backend:**
- CORS will automatically allow requests from any subdomain of `bizabodeserver.org`
- No need to update environment variables

---

## ✅ Solution 2: Update FRONTEND_URL Environment Variable

**If you want to use the specific frontend domain:**

1. **In Coolify → Backend Service → Environment Variables:**

2. **Update `FRONTEND_URL`:**
   ```
   FRONTEND_URL=https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org
   ```

3. **Or add both domains:**
   ```
   FRONTEND_URL=https://accountingsuite.bizabodeserver.org,https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org
   ```
   (Note: The code currently only checks one `FRONTEND_URL`, but Solution 1 handles this automatically)

4. **Redeploy backend service**

---

## ✅ Solution 3: Use Production Domain (Best Practice)

**If you have a production domain configured:**

1. **In Coolify → Frontend Service:**
   - Configure the domain to use: `accountingsuite.bizabodeserver.org`
   - Remove or don't use the preview/random subdomain

2. **In Coolify → Backend Service → Environment Variables:**
   ```
   FRONTEND_URL=https://accountingsuite.bizabodeserver.org
   ```

3. **Redeploy both services**

---

## 🔍 Verify CORS is Working

**After fixing, check backend logs:**

```bash
# Should see:
CORS: Allowing origin https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org (same base domain as https://accountingsuite.bizabodeserver.org)
```

**Or test in browser console:**

```javascript
fetch('https://accountingsuite.bizabodeserver.org/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Should NOT see CORS errors anymore.**

---

## 📋 Checklist

- [ ] Backend code updated (allows subdomains of same base domain)
- [ ] Backend service redeployed
- [ ] `FRONTEND_URL` set in backend environment variables
- [ ] Frontend can make API requests without CORS errors
- [ ] Login works successfully

---

## 🆘 Still Getting CORS Errors?

**If CORS errors persist:**

1. **Check backend logs:**
   ```bash
   # Look for CORS warnings:
   CORS: Blocked origin ...
   ```

2. **Verify environment variables:**
   ```bash
   # In backend container:
   echo $FRONTEND_URL
   echo $NODE_ENV
   ```

3. **Test CORS manually:**
   ```bash
   # From frontend domain, test preflight:
   curl -X OPTIONS https://accountingsuite.bizabodeserver.org/api/auth/login \
     -H "Origin: https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   
   **Should see:**
   ```
   < Access-Control-Allow-Origin: https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org
   ```

4. **Check if backend is actually running:**
   ```bash
   curl https://accountingsuite.bizabodeserver.org/healthz
   ```

5. **Verify frontend is calling correct API URL:**
   - Check browser Network tab
   - Should be calling: `https://accountingsuite.bizabodeserver.org/api/auth/login`
   - Not: `https://q00w48cg484wggw80gw8o8k4.bizabodeserver.org/api/auth/login`

---

## 💡 Pro Tips

1. **Use production domain** instead of preview subdomains for better consistency
2. **The updated CORS code** automatically handles subdomains, so you don't need to update `FRONTEND_URL` for each preview deployment
3. **Check backend logs** to see which origins are being allowed/blocked
4. **CORS errors in browser console** will show the exact origin that's being blocked

---

## ✅ Success Indicators

After fixing:

- ✅ No CORS errors in browser console
- ✅ API requests succeed (200, 401, etc. - not CORS errors)
- ✅ Login works
- ✅ Backend logs show: `CORS: Allowing origin ...`
- ✅ Network tab shows proper `Access-Control-Allow-Origin` header

