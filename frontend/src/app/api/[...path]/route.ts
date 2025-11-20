import { NextRequest, NextResponse } from 'next/server';

// Backend URL - use internal Docker network name
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
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
  const searchParams = request.nextUrl.search;
  const url = `${BACKEND_URL}/api/${pathString}${searchParams}`;
  
  // Copy headers (except host)
  const headers: HeadersInit = {};
  request.headers.forEach((value, key) => {
    // Skip headers that shouldn't be forwarded
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  try {
    // Get request body for non-GET requests
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
      body = await request.text();
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType,
        // Forward CORS headers if present
        ...(response.headers.get('access-control-allow-origin') && {
          'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin')!,
        }),
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Proxy request failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

