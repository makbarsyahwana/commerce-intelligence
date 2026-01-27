/**
 * Auth.js v5 Middleware
 * 
 * Protects routes using Auth.js getServerSession() for server-side rendering
 * compatibility and proper cookie-based session management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './app/api/auth/index';
import { apiRateLimits } from './lib/middleware/apiRateLimit';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    // Use specific rate limits for different endpoints
    let rateLimitFunction = apiRateLimits.default;
    let rateLimitLimit = '10';
    
    if (pathname.startsWith('/api/admin/')) {
      rateLimitFunction = apiRateLimits.admin;
      rateLimitLimit = '5';
    } else if (pathname === '/api/health') {
      rateLimitFunction = apiRateLimits.health;
      rateLimitLimit = '100';
    }

    const rateLimitResult = rateLimitFunction(request);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetTime!).toLocaleTimeString()}`,
          resetTime: rateLimitResult.resetTime,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitLimit,
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimitLimit);
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining?.toString() || '0');
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime?.toString() || '');
  }

  // Protect admin routes with Auth.js
  if (pathname.startsWith('/api/admin/')) {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
  }

  // Protect only the root dashboard page; do not redirect API routes.
  if (!pathname.startsWith('/api/') && pathname === '/') {
    const session = await auth();

    if (!session?.user) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes (allow sign in/out)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth|api/auth).*)',
  ],
};
