/**
 * Provider API Rate Limiting
 * 
 * Purpose: Control external API calls to third-party providers
 * Usage: Used in fetchProviders.ts to limit requests to external APIs
 * 
 * Features:
 * - Provider-specific rate limiting instances
 * - Configurable limits and windows per provider
 * - Detailed logging for monitoring
 * - Rate limit status checking
 * - Automatic retry timing with clear error messages
 */
import { RateLimitEntry } from "../../types/providers";
import { createLogger } from "../logger";

const logger = createLogger({ operation: 'provider-rate-limit' });

class ProviderRateLimiter {
  private static instances = new Map<string, ProviderRateLimiter>();
  private requests: Map<string, RateLimitEntry> = new Map();

  static getInstance(provider: string): ProviderRateLimiter {
    if (!ProviderRateLimiter.instances.has(provider)) {
      ProviderRateLimiter.instances.set(provider, new ProviderRateLimiter());
    }
    return ProviderRateLimiter.instances.get(provider)!;
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
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + window * 1000, // Convert seconds to milliseconds
      };
      this.requests.set(key, newEntry);
      
      logger.debug('Provider rate limit reset', {
        provider,
        count: 1,
        limit,
        window,
        resetTime: new Date(newEntry.resetTime).toISOString(),
      });
      
      return;
    }

    if (entry.count >= limit) {
      const waitTime = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.warn('Provider rate limit exceeded', {
        provider,
        currentCount: entry.count,
        limit,
        waitTime,
        resetTime: new Date(entry.resetTime).toISOString(),
      });
      
      throw new Error(
        `Rate limit exceeded for ${provider}. Wait ${waitTime} seconds before retrying.`
      );
    }

    // Increment count
    entry.count++;
    
    logger.debug('Provider rate limit updated', {
      provider,
      count: entry.count,
      limit,
      remaining: limit - entry.count,
    });
  }

  // Get current rate limit status for a provider
  getStatus(provider: string): { count: number; limit: number; resetTime: number; remaining: number } | null {
    const entry = this.requests.get(provider);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.resetTime) return null;
    
    return {
      count: entry.count,
      limit: 10, // This would need to be tracked separately if needed
      resetTime: entry.resetTime,
      remaining: Math.max(0, 10 - entry.count),
    };
  }

  // Reset rate limit for a provider (useful for testing)
  reset(provider: string): void {
    this.requests.delete(provider);
    logger.info('Provider rate limit reset', { provider });
  }

  getRemainingRequests(provider: string, window: number): number {
    const entry = this.requests.get(provider);
    if (!entry || Date.now() > entry.resetTime) {
      return window; // Full limit available
    }
    return Math.max(0, window - entry.count);
  }
}

export { ProviderRateLimiter };

// Convenience function for checking rate limits
export async function checkRateLimit(
  provider: string,
  limit: number,
  window: number
): Promise<void> {
  const rateLimiter = ProviderRateLimiter.getInstance(provider);
  await rateLimiter.checkLimit(provider, limit, window);
}

// Get rate limit status for monitoring
export function getRateLimitStatus(provider: string) {
  const rateLimiter = ProviderRateLimiter.getInstance(provider);
  return rateLimiter.getStatus(provider);
}
