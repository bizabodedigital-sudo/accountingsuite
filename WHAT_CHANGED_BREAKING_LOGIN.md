# What Changed That Broke Login

## Summary
The app worked in commits `2bb0fdc` and `53d0f4a`, but login stopped working after commit `0f93217`.

## Root Cause

### 1. API URL Handling Change (Commit 0f93217)
**What changed:**
- **Before (working):** `api.ts` would use `NEXT_PUBLIC_API_URL` directly if set, otherwise use relative URLs
- **After (broken):** `api.ts` always used relative URLs (`/api`), ignoring `NEXT_PUBLIC_API_URL`

**Impact:**
- If `NEXT_PUBLIC_API_URL` was set in Coolify (e.g., `https://api.example.com`), the app would use it directly
- After the change, it always went through the Next.js proxy route, which may not have been configured correctly

### 2. Environment Variable Defaults Removed (Commit c8c9772)
**What changed:**
- Removed localhost defaults from `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`
- Made these variables **REQUIRED** with no fallbacks

**Impact:**
- If these variables aren't set in Coolify, the app won't work at all
- No graceful fallback to localhost for development

## The Fix

### ✅ Restored Working Behavior
I've restored the `api.ts` file to use the working logic:
- If `NEXT_PUBLIC_API_URL` is set → use it directly (bypass proxy)
- If not set → use relative URLs (`/api`) which go through the Next.js proxy

**File changed:** `frontend/src/lib/api.ts`

```typescript
// RESTORED: Use NEXT_PUBLIC_API_URL if set (direct connection), otherwise use relative URLs (proxy)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? '' // Use relative URLs - Next.js will proxy via /api/[...path]
    : 'http://localhost:3001');

// RESTORED: Use API_BASE_URL in baseURL
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // ...
});
```

## What You Need to Check in Coolify

### 1. Environment Variables
Make sure these are set in Coolify:
- `NEXT_PUBLIC_API_URL` - Your external API URL (e.g., `https://api.yourdomain.com`)
- `NEXT_PUBLIC_APP_URL` - Your frontend URL (e.g., `https://app.yourdomain.com`)
- `FRONTEND_URL` - Same as `NEXT_PUBLIC_APP_URL` (for backend CORS)

### 2. How It Works Now
- **If `NEXT_PUBLIC_API_URL` is set:** Frontend connects directly to that URL (no proxy)
- **If `NEXT_PUBLIC_API_URL` is NOT set:** Frontend uses relative URLs (`/api/*`) which go through the Next.js proxy route to `http://backend:3001`

### 3. Recommended Setup for Coolify
**Option A: Direct API Connection (Recommended)**
- Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- Frontend connects directly to backend API
- No proxy needed

**Option B: Proxy Through Next.js**
- Don't set `NEXT_PUBLIC_API_URL` (or set it empty)
- Frontend uses `/api/*` which proxies to `http://backend:3001`
- Requires the Next.js proxy route to be working correctly

## Testing
After deploying the fix:
1. Check browser console for API calls
2. Verify login requests go to the correct URL
3. Check network tab to see if requests are successful

## Related Commits
- `2bb0fdc` - Added Next.js API proxy route (working)
- `53d0f4a` - Improved dashboard error handling (working)
- `0f93217` - **BROKE:** Changed api.ts to always use relative URLs
- `c8c9772` - Removed localhost defaults (made env vars required)


