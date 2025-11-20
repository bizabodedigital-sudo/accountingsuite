# Fix Coolify API Routing - 502 Error Solution

## Problem
- ✅ Backend is healthy and working (port 3001)
- ✅ Database is connected and users exist
- ❌ Frontend gets 502 when calling `/api/*` endpoints
- **Root Cause:** Coolify isn't routing `/api/*` requests to the backend service

## Solution Options

### Option 1: Configure Path-Based Routing in Coolify (Recommended)

In Coolify, you need to configure the domain to route API requests:

1. **Go to your application in Coolify**
2. **Find the domain configuration** for `accountingsuite.bizabodeserver.org`
3. **Add path-based routing:**
   - Path: `/api/*`
   - Target Service: `backend`
   - Target Port: `3001`
   - Path Rewrite: Remove `/api` prefix OR keep it (depending on your backend routes)

**OR** if Coolify doesn't support path routing in Docker Compose:

### Option 2: Use Next.js API Routes as Proxy

Create a Next.js API route that proxies requests to the backend:

**Create:** `frontend/src/app/api/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  const pathString = path.join('/');
  const url = `${BACKEND_URL}/api/${pathString}${request.nextUrl.search}`;
  
  const headers: HeadersInit = {};
  request.headers.forEach((value, key) => {
    if (key !== 'host') {
      headers[key] = value;
    }
  });

  try {
    const body = method !== 'GET' && method !== 'HEAD' 
      ? await request.text() 
      : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

Then update `frontend/src/lib/api.ts` to use relative URLs:

```typescript
const API_BASE_URL = ''; // Use relative URLs - Next.js will proxy
```

### Option 3: Use Separate Backend Domain

Configure a separate domain/subdomain for the backend API:

- Frontend: `accountingsuite.bizabodeserver.org`
- Backend API: `api.accountingsuite.bizabodeserver.org` or `accountingsuite-api.bizabodeserver.org`

Then update `NEXT_PUBLIC_API_URL` to point to the backend domain.

## Quick Test

After implementing one of the solutions, test with:

```bash
curl https://accountingsuite.bizabodeserver.org/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@jamaicatech.com","password":"password123"}'
```

Should return a JWT token, not a 502 error.

## Current Status

- ✅ Backend: Working perfectly on port 3001
- ✅ Database: Connected with 3 users
- ✅ Passwords: Verified and working
- ❌ Routing: `/api/*` not reaching backend (502 error)

