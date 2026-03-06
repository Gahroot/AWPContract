// TODO: Replace with Redis (e.g. @upstash/ratelimit) before production deployment.
// In-memory rate limiting does not persist across serverless instances.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limiter for protecting auth endpoints from brute force attacks
 * Uses in-memory storage (consider Redis for production with multiple instances)
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    rateLimitMap.delete(identifier);
  }

  const currentEntry = rateLimitMap.get(identifier);

  if (!currentEntry) {
    // First request in window
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (currentEntry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  // Increment count
  currentEntry.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - currentEntry.count,
    resetAt: currentEntry.resetAt,
  };
}

/**
 * Rate limit configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // Auth endpoints: 5 requests per 15 minutes per IP
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // API endpoints: 100 requests per minute per IP
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const;

/**
 * Extract client identifier from request
 * Uses X-Forwarded-For header if available (for production behind proxy)
 * Falls back to a generic identifier if no IP is available
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  return `auth:${ip}`;
}
