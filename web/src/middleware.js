import { NextResponse } from 'next/server';
import {
  strictRateLimit,
  moderateRateLimit,
  looseRateLimit,
  otpSendRateLimit,
  otpVerifyRateLimit,
} from '@/lib/rateLimit';

// Allowed origins for CORS — comma-separated in ALLOWED_ORIGIN, e.g. https://ratradingco.com,https://www.ratradingco.com
const getAllowedOrigin = (origin) => {
  const fromEnv =
    process.env.ALLOWED_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const allowedOrigins = [
    ...fromEnv,
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  // If no origin specified, restrict in production
  if (!origin) {
    return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // In production, be strict - no wildcards
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // In development, allow localhost only
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }

  return null;
};

export async function middleware(request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  // In development, don't rate-limit admin API calls (fast refresh + admin UI causes bursts)
  if (
    process.env.NODE_ENV !== "production" &&
    request.nextUrl.pathname.startsWith("/api/admin/")
  ) {
    return NextResponse.next();
  }

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const headers = {
        ...securityHeaders,
        'Access-Control-Max-Age': '86400',
      };

      if (allowedOrigin) {
        headers['Access-Control-Allow-Origin'] = allowedOrigin;
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        headers['Access-Control-Allow-Credentials'] = 'true';
      }

      return new NextResponse(null, { status: 200, headers });
    }

    const pathname = request.nextUrl.pathname;
    let rateLimiter;

    const devRelaxOtp =
      process.env.NODE_ENV !== 'production' &&
      process.env.RATE_LIMIT_STRICT_OTP !== 'true';

    if (pathname.includes('/send-otp')) {
      rateLimiter = devRelaxOtp ? looseRateLimit : otpSendRateLimit;
    } else if (pathname.includes('/verify-otp')) {
      rateLimiter = devRelaxOtp ? looseRateLimit : otpVerifyRateLimit;
    } else if (
      pathname.includes('/login') ||
      pathname.includes('/contact-form')
    ) {
      rateLimiter = strictRateLimit;
    }
    // Moderate rate limiting for admin endpoints
    else if (pathname.includes('/admin/')) {
      rateLimiter = moderateRateLimit;
    }
    // Loose rate limiting for public store endpoints
    else {
      rateLimiter = looseRateLimit;
    }

    const rateLimitResult = await rateLimiter(request);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...securityHeaders,
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            ...(allowedOrigin && { 'Access-Control-Allow-Origin': allowedOrigin }),
          },
        }
      );
    }

    // For other requests, add CORS and security headers to the response
    const response = NextResponse.next();
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Add rate limit info to headers
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

