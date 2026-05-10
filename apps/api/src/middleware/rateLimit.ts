import { Request, Response, NextFunction } from 'express';
import { rateLimitService } from '../config/redis';

// Number of consecutive rate-limit violations before an IP is blocked.
const VIOLATIONS_BEFORE_BLOCK = 5;
// Duration to block an IP after excessive violations (15 minutes).
const BLOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Track consecutive rate-limit violations per IP.
 * Uses an in-process counter as a lightweight supplement to Redis blocking.
 */
const violationCounts = new Map<string, number>();

/**
 * Global rate limiting middleware — 100 requests/minute per IP (or user ID).
 * - Checks IP block status first; returns 403 if blocked.
 * - Sets X-RateLimit-* headers on every response.
 * - Sets Retry-After header when rate limited.
 * - After 5 consecutive violations, blocks the IP for 15 minutes.
 */
export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || (req as any).user?.walletAddress;

    // Check if IP is blocked — return 403 immediately.
    const isBlocked = await rateLimitService.isIpBlocked(ip);
    if (isBlocked) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'IP_BLOCKED',
        message: 'IP address is temporarily blocked due to excessive requests',
      });
    }

    // Apply rate limiting by user ID (authenticated) or IP (anonymous).
    const limitResult = userId
      ? await rateLimitService.limitByUserId(userId)
      : await rateLimitService.limitByIp(ip);

    // Set rate limit headers on every response.
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', limitResult.remaining.toString());
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(limitResult.reset / 1000).toString()
    );

    if (!limitResult.allowed) {
      // Track consecutive violations and block after threshold.
      const violations = (violationCounts.get(ip) ?? 0) + 1;
      violationCounts.set(ip, violations);

      if (violations >= VIOLATIONS_BEFORE_BLOCK) {
        violationCounts.delete(ip);
        await rateLimitService.blockIp(ip, BLOCK_DURATION_MS);
      }

      res.setHeader('Retry-After', limitResult.retryAfter?.toString() ?? '60');
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: limitResult.retryAfter,
      });
    }

    // Successful request — reset violation counter.
    violationCounts.delete(ip);

    return next();
  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    // Allow request if rate limiting fails to avoid blocking legitimate traffic.
    return next();
  }
};

/**
 * Authentication rate limiting middleware — 10 attempts/minute per identifier.
 * Sets X-RateLimit-* and Retry-After headers.
 */
export const authRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const identifier =
      req.body?.walletAddress || req.ip || 'unknown';

    const limitResult = await rateLimitService.limitAuthAttempts(identifier);

    // Set rate limit headers on every response.
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', limitResult.remaining.toString());
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(limitResult.reset / 1000).toString()
    );

    if (!limitResult.allowed) {
      res.setHeader('Retry-After', limitResult.retryAfter?.toString() ?? '60');
      return res.status(429).json({
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: limitResult.retryAfter,
      });
    }

    return next();
  } catch (error) {
    console.error('Auth rate limiting middleware error:', error);
    return next();
  }
};

/**
 * Whitelist middleware — skips rate limiting for trusted internal IPs.
 */
export const whitelistMiddleware = (whitelistedIps: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress;

    if (whitelistedIps.includes(ip ?? '')) {
      return next();
    }

    rateLimitMiddleware(req, res, next);
  };
};

/**
 * Cache middleware for GET requests.
 * Skips caching for authenticated endpoints.
 */
export const cacheMiddleware = (durationMs: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (req.headers.authorization) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      const cached = await (req as any).cacheService?.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const originalJson = res.json;
      res.json = function (body: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          (req as any).cacheService
            ?.set(cacheKey, body, durationMs)
            .catch(console.error);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};
