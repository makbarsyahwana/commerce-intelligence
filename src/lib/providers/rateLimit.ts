import { RateLimitEntry } from "../../types/providers";

class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private requests: Map<string, RateLimitEntry> = new Map();

  static getInstance(provider: string): RateLimiter {
    if (!RateLimiter.instances.has(provider)) {
      RateLimiter.instances.set(provider, new RateLimiter());
    }
    return RateLimiter.instances.get(provider)!;
  }

  async checkLimit(
    provider: string,
    limit: number,
    window: number
  ): Promise<void> {
    const now = Date.now();
    const key = provider;
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.requests.set(key, {
        count: 1,
        resetTime: now + window * 1000,
      });
      return;
    }

    if (entry.count >= limit) {
      const waitTime = Math.ceil((entry.resetTime - now) / 1000);
      throw new Error(
        `Rate limit exceeded for ${provider}. Wait ${waitTime} seconds.`
      );
    }

    entry.count++;
  }

  getRemainingRequests(provider: string, window: number): number {
    const entry = this.requests.get(provider);
    if (!entry || Date.now() > entry.resetTime) {
      return window; // Full limit available
    }
    return Math.max(0, window - entry.count);
  }
}

export async function checkRateLimit(
  provider: string,
  limit: number,
  window: number
): Promise<void> {
  const limiter = RateLimiter.getInstance(provider);
  await limiter.checkLimit(provider, limit, window);
}

export function getRemainingRequests(provider: string, window: number): number {
  const limiter = RateLimiter.getInstance(provider);
  return limiter.getRemainingRequests(provider, window);
}
