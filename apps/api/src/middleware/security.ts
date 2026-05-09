import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from '../config/env';

/**
 * CORS middleware configured with allowed origins from config.
 */
export const corsMiddleware = cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
});

/**
 * Security headers middleware.
 * Sets standard security headers on every response.
 * HSTS is only applied in production.
 */
export const securityHeadersMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  if (config.isProduction) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  next();
};

/**
 * Content-Type validation middleware.
 * Rejects POST, PUT, and PATCH requests that do not declare
 * Content-Type: application/json.
 */
export const contentTypeValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const methodsRequiringJson = ['POST', 'PUT', 'PATCH'];

  if (methodsRequiringJson.includes(req.method)) {
    const contentType = req.headers['content-type'] ?? '';

    if (!contentType.includes('application/json')) {
      res.status(415).json({
        error: 'Unsupported Media Type',
        code: 'UNSUPPORTED_MEDIA_TYPE',
      });
      return;
    }
  }

  next();
};
