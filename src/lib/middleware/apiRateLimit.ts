/**
 * API Endpoint Rate Limiting
 * 
 * Purpose: Protect HTTP API routes from abuse and DoS attacks
 * Usage: Applied in middleware.ts to all /api/* routes
 * 
 * Features:
 * - IP-based rate limiting
 * - Different limits for different endpoint types
 * - Automatic cleanup of expired entries
 * - Rate limit headers in responses
 */
interface ApiRateLimitEntry {
  count: number;
  resetTime: number;
}

class ApiRateLimiter {
  private requests = new Map<string, ApiRateLimitEntry>();

  checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      const newEntry: ApiRateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.requests.set(key, newEntry);

      return {
        allowed: true,
        resetTime: newEntry.resetTime,
        remaining: limit - 1,
      };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }

    // Increment count
    entry.count++;
    
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: limit - entry.count,
    };
  }

  // Cleanup expired entries (call periodically)
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global API rate limiter instance
const apiRateLimiter = new ApiRateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => apiRateLimiter.cleanup(), 5 * 60 * 1000);
}

export interface ApiRateLimitOptions {
  limit?: number;
  windowMs?: number;
}

export function createApiRateLimit(options: ApiRateLimitOptions = {}) {
  const { limit = 10, windowMs = 60 * 1000 } = options; // 10 requests per minute default

  return function rateLimit(request: Request) {
    // Use IP address as the key
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    return apiRateLimiter.checkLimit(ip, limit, windowMs);
  };
}

// Predefined rate limits for different API endpoints
export const apiRateLimits = {
  // Admin endpoints: more restrictive
  admin: createApiRateLimit({ limit: 5, windowMs: 60 * 1000 }), // 5 requests per minute
  
  // Health checks: more lenient
  health: createApiRateLimit({ limit: 100, windowMs: 60 * 1000 }), // 100 requests per minute
  
  // Default rate limit
  default: createApiRateLimit({ limit: 10, windowMs: 60 * 1000 }),
};
