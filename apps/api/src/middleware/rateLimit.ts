import { Request, Response, NextFunction } from 'express';
import { rateLimitService } from '../config/redis';

// Rate limiting middleware
export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get client identifier (IP address or user ID)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || (req as any).user?.walletAddress;

    // Check if IP is blocked
    const isBlocked = await rateLimitService.isIpBlocked(ip);
    if (isBlocked) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'IP address temporarily blocked due to excessive requests',
        retryAfter: 300, // 5 minutes
      });
    }

    // Apply rate limiting
    let limitResult;
    if (userId) {
      // Authenticated user - limit by user ID
      limitResult = await rateLimitService.limitByUserId(userId);
    } else {
      // Anonymous user - limit by IP
      limitResult = await rateLimitService.limitByIp(ip);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', userId ? '100' : '100');
    res.setHeader('X-RateLimit-Remaining', limitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(limitResult.reset / 1000).toString());

    if (!limitResult.allowed) {
      // Check if this is the 5th violation in 1 hour
      const violationKey = `violation:${ip}`;
      const violations = await rateLimitService.limitAuthAttempts(violationKey);
      
      if (violations.remaining <= 0) {
        // Block IP for 1 hour
        await rateLimitService.blockIp(ip, 60 * 60 * 1000);
      }

      res.setHeader('Retry-After', limitResult.retryAfter?.toString() || '60');
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: limitResult.retryAfter,
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    // Allow request if rate limiting fails
    next();
  }
};

// Authentication rate limiting middleware
export const authRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const identifier = req.body.walletAddress || req.ip || 'unknown';
    
    const limitResult = await rateLimitService.limitAuthAttempts(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', limitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(limitResult.reset / 1000).toString());

    if (!limitResult.allowed) {
      res.setHeader('Retry-After', limitResult.retryAfter?.toString() || '60');
      return res.status(429).json({
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: limitResult.retryAfter,
      });
    }

    next();
  } catch (error) {
    console.error('Auth rate limiting middleware error:', error);
    // Allow request if rate limiting fails
    next();
  }
};

// Whitelist middleware for internal services
export const whitelistMiddleware = (whitelistedIps: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress;
    
    if (whitelistedIps.includes(ip || '')) {
      // Skip rate limiting for whitelisted IPs
      return next();
    }

    // Apply regular rate limiting
    rateLimitMiddleware(req, res, next);
  };
};

// Cache middleware for GET requests
export const cacheMiddleware = (durationMs: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for authenticated endpoints
    if (req.headers.authorization) {
      return next();
    }

    // Generate cache key from request
    const cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      // Check cache
      const cached = await (req as any).cacheService?.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Override res.json to cache response
      const originalJson = res.json;
      res.json = function(body: any) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          (req as any).cacheService?.set(cacheKey, body, durationMs).catch(console.error);
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